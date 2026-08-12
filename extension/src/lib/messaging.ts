export type SyncMessagePayload = { role: "user" | "assistant"; content: string };

export const SIDEQUEST_TRIGGER = "SIDEQUEST_TRIGGER";

export type SideQuestTriggerResponse = {
  threadId: string | null;
  selectedText: string;
  messages: SyncMessagePayload[];
};

export type PendingQuery = SideQuestTriggerResponse & { capturedAt: number };
