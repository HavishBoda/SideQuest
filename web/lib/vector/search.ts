import { generateEmbedding } from "./index";
import { getMessageCollection } from "./collections";

export async function searchMessages({
  conversationId,
  query,
  topK = 8,
}: {
  conversationId: string;
  query: string;
  topK?: number;
}): Promise<Array<{ messageId: string; role: string; content: string; distance: number }>> {
  const embedding = await generateEmbedding(query);
  const collection = await getMessageCollection();

  const result = await collection.query({
    queryEmbeddings: [embedding],
    nResults: topK,
    where: { conversationId },
    include: ["documents", "metadatas", "distances"],
  });

  const ids = result.ids[0] ?? [];
  const documents = result.documents[0] ?? [];
  const metadatas = result.metadatas[0] ?? [];
  const distances = result.distances?.[0] ?? [];

  return ids.map((id, i) => ({
    messageId: id,
    role: (metadatas[i]?.role as string | undefined) ?? "user",
    content: documents[i] ?? "",
    distance: distances[i] ?? 0,
  }));
}
