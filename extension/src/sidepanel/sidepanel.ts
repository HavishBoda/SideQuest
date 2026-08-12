import { syncConversation, query } from "../lib/api";
import type { PendingQuery } from "../lib/messaging";

let currentConversationId: string | null = null;

const excerptEl = document.getElementById("excerpt") as HTMLDivElement;
const syncStatusEl = document.getElementById("sync-status") as HTMLDivElement;
const contextModeEl = document.getElementById("context-mode") as HTMLSelectElement;
const questionEl = document.getElementById("question") as HTMLTextAreaElement;
const submitEl = document.getElementById("submit") as HTMLButtonElement;
const answerSectionEl = document.getElementById("answer-section") as HTMLElement;
const answerEl = document.getElementById("answer") as HTMLDivElement;
const errorSectionEl = document.getElementById("error-section") as HTMLDivElement;

function showError(message: string) {
  errorSectionEl.textContent = message;
  errorSectionEl.hidden = false;
}

function clearError() {
  errorSectionEl.hidden = true;
  errorSectionEl.textContent = "";
}

async function applyPendingQuery(pending: PendingQuery) {
  currentConversationId = null;
  excerptEl.textContent = pending.selectedText || "(no text highlighted)";
  answerSectionEl.hidden = true;
  clearError();

  if (!pending.threadId) {
    syncStatusEl.textContent =
      "This chat doesn't have a URL yet - send a message in ChatGPT first, then try again.";
    submitEl.disabled = true;
    return;
  }

  submitEl.disabled = false;
  syncStatusEl.textContent = "Syncing conversation...";
  try {
    const result = await syncConversation({
      chatgptThreadId: pending.threadId,
      messages: pending.messages,
    });
    currentConversationId = result.conversationId;
    syncStatusEl.textContent = `Synced (${result.totalMessageCount} messages, ${result.newMessageCount} new).`;
  } catch (err) {
    syncStatusEl.textContent = "";
    showError(err instanceof Error ? err.message : "Failed to sync conversation.");
    submitEl.disabled = true;
  }
}

async function loadPending() {
  const stored = await chrome.storage.session.get("pendingQuery");
  const pending = stored.pendingQuery as PendingQuery | undefined;
  if (pending) void applyPendingQuery(pending);
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "session" || !changes.pendingQuery) return;
  const pending = changes.pendingQuery.newValue as PendingQuery | undefined;
  if (pending) void applyPendingQuery(pending);
});

submitEl.addEventListener("click", async () => {
  clearError();
  const question = questionEl.value.trim();
  if (!question) {
    showError("Enter a question first.");
    return;
  }
  if (!currentConversationId) {
    showError("Conversation hasn't synced yet.");
    return;
  }

  submitEl.disabled = true;
  submitEl.textContent = "Asking...";
  try {
    const result = await query({
      conversationId: currentConversationId,
      selectedText: excerptEl.textContent ?? undefined,
      question,
      contextMode: contextModeEl.value as "none" | "recent" | "full" | "summary",
    });
    answerEl.textContent = result.answer;
    answerSectionEl.hidden = false;
  } catch (err) {
    showError(err instanceof Error ? err.message : "Failed to get an answer.");
  } finally {
    submitEl.disabled = false;
    submitEl.textContent = "Ask";
  }
});

void loadPending();
