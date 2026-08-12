import { getEmbedding } from "../llm";
import { getMessageCollection } from "./collections";

export async function generateEmbedding(text: string): Promise<number[]> {
  return getEmbedding(text);
}

export async function indexMessage({
  conversationId,
  messageId,
  role,
  content,
}: {
  conversationId: string;
  messageId: string;
  role: string;
  content: string;
}): Promise<void> {
  const embedding = await generateEmbedding(content);
  const collection = await getMessageCollection();
  await collection.add({
    ids: [messageId],
    embeddings: [embedding],
    documents: [content],
    metadatas: [{ conversationId, role }],
  });
}

export async function indexMessages(
  messages: Array<{ conversationId: string; messageId: string; role: string; content: string }>,
): Promise<void> {
  for (const message of messages) {
    await indexMessage(message);
  }
}
