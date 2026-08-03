import { getRecentContext } from "./recent";
import { getRetrievedContext } from "./retrieval";
import { getSummaryContext } from "./summary";

export async function getContext({
  mode,
  conversationId,
  question,
}: {
  mode: string;
  conversationId: string;
  question: string;
}){
    switch (mode){
        case "none":
            return ""
        case "recent":
            return await getRecentContext(conversationId);
        case "full":
            return await getRetrievedContext(conversationId, question);
        case "summary":
            return await getSummaryContext(conversationId);
        default:
            return ""
    }
}