import { prisma } from "@/lib/db/client";

export async function getRecentContext(conversationId: string) {
  const recentMessages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { role: true, content: true },
  });

  return recentMessages.reverse();
}
