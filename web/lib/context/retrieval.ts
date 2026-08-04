import { prisma } from "@/lib/db/client";

export async function getRetrievedContext(conversationId: string, question: string) {
  void question;

  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: { role: true, content: true },
  });
}
