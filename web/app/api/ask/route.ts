import { getContext } from "@/lib/context";
import { prisma } from "@/lib/db/client";
import { generate, OllamaError } from "@/lib/llm/ollama";
import { buildPrompt } from "@/lib/prompts/builder";

export const runtime = "nodejs";

const contextModes = ["none", "recent", "full", "summary"] as const;
type ContextMode = (typeof contextModes)[number];

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const { question, contextMode = "recent", conversationId } = body as {
    question?: unknown;
    contextMode?: unknown;
    conversationId?: unknown;
  };

  if (typeof question !== "string" || !question.trim()) {
    return Response.json({ error: "question must be a non-empty string." }, { status: 400 });
  }
  if (typeof conversationId !== "undefined" && typeof conversationId !== "string") {
    return Response.json({ error: "conversationId must be a string." }, { status: 400 });
  }
  if (!contextModes.includes(contextMode as ContextMode)) {
    return Response.json({ error: "contextMode must be none, recent, full, or summary." }, { status: 400 });
  }

  const cleanedQuestion = question.trim();
  const suppliedConversationId = conversationId?.trim();
  const conversation = suppliedConversationId
    ? await prisma.conversation.upsert({
        where: { id: suppliedConversationId },
        update: {},
        create: { id: suppliedConversationId, title: cleanedQuestion.slice(0, 80) },
      })
    : await prisma.conversation.create({ data: { title: cleanedQuestion.slice(0, 80) } });

  const context = await getContext({
    mode: contextMode as ContextMode,
    conversationId: conversation.id,
    question: cleanedQuestion,
  });

  await prisma.message.create({
    data: { conversationId: conversation.id, role: "user", content: cleanedQuestion },
  });

  try {
    const answer = await generate(buildPrompt({ question: cleanedQuestion, context }));
    await prisma.message.create({
      data: { conversationId: conversation.id, role: "assistant", content: answer },
    });

    return Response.json({ answer, conversationId: conversation.id });
  } catch (error) {
    const message = error instanceof OllamaError ? error.message : "Unable to generate an answer.";
    return Response.json({ error: message, conversationId: conversation.id }, { status: 502 });
  }
}
