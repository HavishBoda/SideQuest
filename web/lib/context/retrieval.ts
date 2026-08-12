import { prisma } from "@/lib/db/client";
import { searchMessages } from "@/lib/vector/search";

export async function getRetrievedContext(conversationId: string, question: string) {
  const matches = await searchMessages({ conversationId, query: question });
  if (matches.length === 0) return [];

  // Re-order matches chronologically - Chroma returns them ranked by
  // relevance, but the prompt reads more naturally in conversation order.
  const messageIds = matches.map((m) => m.messageId);
  return prisma.message.findMany({
    where: { id: { in: messageIds } },
    orderBy: { createdAt: "asc" },
    select: { role: true, content: true },
  });
}
