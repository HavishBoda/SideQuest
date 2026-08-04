import { prisma } from "@/lib/db/client";

export async function getSummaryContext(conversationId: string) {
  const summary = await prisma.summary.findUnique({
    where: { conversationId },
    select: { summary: true },
  });

  return summary?.summary ?? "";
}
