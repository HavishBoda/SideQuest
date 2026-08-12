import type { SyncMessagePayload } from "./messaging";

const DEFAULT_API_BASE_URL = "http://localhost:3000";

async function getApiBaseUrl(): Promise<string> {
  const stored = await chrome.storage.local.get("apiBaseUrl");
  return (stored.apiBaseUrl as string | undefined) ?? DEFAULT_API_BASE_URL;
}

type SyncResult = { conversationId: string; newMessageCount: number; totalMessageCount: number };

export async function syncConversation(params: {
  chatgptThreadId: string;
  title?: string;
  messages: SyncMessagePayload[];
}): Promise<SyncResult> {
  const baseUrl = await getApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/conversations/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Sync failed with status ${res.status}`);
  return data as SyncResult;
}

export async function query(params: {
  conversationId: string;
  selectedText?: string;
  question: string;
  contextMode: "none" | "recent" | "full" | "summary";
}): Promise<{ answer: string }> {
  const baseUrl = await getApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Query failed with status ${res.status}`);
  return data as { answer: string };
}
