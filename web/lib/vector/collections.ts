import { chroma } from "./client";

export async function getMessageCollection() {
  return await chroma.getOrCreateCollection({
    name: "conversation_messages",
    // We always supply precomputed Ollama embeddings ourselves - no need for
    // Chroma's default embedding function (which requires an extra package).
    embeddingFunction: null,
  });
}