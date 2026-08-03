import { prisma } from "@/lib/db/client";

export async function getRecentContext(convoId: string){
    const recentMessages = await prisma.message.findMany({
        where: { conversationId: convoId },
        orderBy: { createdAt: "desc" },
        take: 10,
    });
    return recentMessages.reverse();
}