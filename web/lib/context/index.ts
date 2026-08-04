import { getRecentContext } from "./recent";
import { getRetrievedContext } from "./retrieval";
import { getSummaryContext } from "./summary";

export async function getContext({
  mode,
  conversationId,
  question,
}: {
  mode: "none" | "recent" | "full" | "summary" | undefined;
  conversationId: string;
  question: string;
}): Promise<string> {
  switch (mode) {
    case "none":
      return "";
    case "recent":
      return formatMessages(await getRecentContext(conversationId));
    case "full":
      return formatMessages(await getRetrievedContext(conversationId, question));
    case "summary":
      return getSummaryContext(conversationId);
    default:
      return "";
  }
}

function formatMessages(messages: Array<{ role: string; content: string }>) {
  return messages.map(({ role, content }) => `${role}: ${content}`).join("\n");
}
