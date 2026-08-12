import { prisma } from "@/lib/db/client";
import { generate } from "@/lib/llm";

export async function updateSummary(conversationId: string): Promise<void> {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: { role: true, content: true },
  });
  if (messages.length === 0) return;

  const transcript = messages.map(({ role, content }) => `${role}: ${content}`).join("\n");
  const prompt = `Summarize this conversation concisely, preserving key facts and decisions:\n\n${transcript}`;
  const summary = await generate(prompt);

  await prisma.summary.upsert({
    where: { conversationId },
    update: { summary },
    create: { conversationId, summary },
  });
}
