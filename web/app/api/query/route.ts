import { getContext } from "@/lib/context";
import { prisma } from "@/lib/db/client";
import { generate, OllamaError } from "@/lib/llm";
import { buildPrompt } from "@/lib/prompts/builder";
import { withCors } from "@/lib/http/cors";

export const runtime = "nodejs";

const contextModes = ["none", "recent", "full", "summary"] as const;
type ContextMode = (typeof contextModes)[number];

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return withCors(Response.json({ error: "Request body must be valid JSON." }, { status: 400 }));
  }

  const {
    conversationId,
    selectedText,
    question,
    contextMode = "recent",
  } = body as {
    conversationId?: unknown;
    selectedText?: unknown;
    question?: unknown;
    contextMode?: unknown;
  };

  if (typeof conversationId !== "string" || !conversationId.trim()) {
    return withCors(Response.json({ error: "conversationId must be a non-empty string." }, { status: 400 }));
  }
  if (typeof question !== "string" || !question.trim()) {
    return withCors(Response.json({ error: "question must be a non-empty string." }, { status: 400 }));
  }
  if (typeof selectedText !== "undefined" && typeof selectedText !== "string") {
    return withCors(Response.json({ error: "selectedText must be a string." }, { status: 400 }));
  }
  if (!contextModes.includes(contextMode as ContextMode)) {
    return withCors(Response.json({ error: "contextMode must be none, recent, full, or summary." }, { status: 400 }));
  }

  const cleanedConversationId = conversationId.trim();
  const cleanedQuestion = question.trim();
  const cleanedSelectedText = (selectedText as string | undefined)?.trim() || undefined;

  const conversation = await prisma.conversation.findUnique({ where: { id: cleanedConversationId } });
  if (!conversation) {
    return withCors(
      Response.json({ error: "No synced conversation found for this conversationId." }, { status: 404 }),
    );
  }

  const context = await getContext({
    mode: contextMode as ContextMode,
    conversationId: cleanedConversationId,
    question: cleanedQuestion,
  });

  try {
    const answer = await generate(
      buildPrompt({ question: cleanedQuestion, context, selectedText: cleanedSelectedText }),
    );

    await prisma.sideQuery.create({
      data: {
        conversationId: cleanedConversationId,
        selectedText: cleanedSelectedText ?? "",
        question: cleanedQuestion,
        contextMode: contextMode as ContextMode,
        answer,
      },
    });

    return withCors(Response.json({ answer }));
  } catch (error) {
    console.error("POST /api/query failed", error);
    const message = error instanceof OllamaError ? error.message : "Unable to generate an answer.";
    return withCors(Response.json({ error: message }, { status: 502 }));
  }
}

export async function OPTIONS() {
  return withCors(new Response(null, { status: 204 }));
}
