import { chroma } from "./client";

export async function getMessageCollection() {
  return await chroma.getOrCreateCollection({
    name: "conversation_messages",
  });
}