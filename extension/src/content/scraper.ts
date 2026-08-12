import type { SyncMessagePayload } from "../lib/messaging";

// NOTE: these selectors target ChatGPT's historically-documented DOM shape
// (data-message-author-role on each turn's content node). ChatGPT's DOM can
// change without notice - if scraping stops working, re-inspect a live
// conversation in devtools and update ROLE_SELECTOR/TURN_SELECTOR.
const ROLE_SELECTOR = "[data-message-author-role]";
const TURN_SELECTOR = '[data-testid^="conversation-turn-"]';

function extractFromRoleAttribute(): SyncMessagePayload[] {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(ROLE_SELECTOR));
  const messages: SyncMessagePayload[] = [];
  for (const node of nodes) {
    const role = node.getAttribute("data-message-author-role");
    const content = node.innerText.trim();
    if (!content || (role !== "user" && role !== "assistant")) continue;
    messages.push({ role, content });
  }
  return messages;
}

// Fallback if data-message-author-role disappears: assume turns alternate,
// starting with the user.
function extractFromTurnFallback(): SyncMessagePayload[] {
  const turns = Array.from(document.querySelectorAll<HTMLElement>(TURN_SELECTOR));
  const messages: SyncMessagePayload[] = [];
  turns.forEach((node, i) => {
    const content = node.innerText.trim();
    if (!content) return;
    messages.push({ role: i % 2 === 0 ? "user" : "assistant", content });
  });
  return messages;
}

export function scrapeConversation(): SyncMessagePayload[] {
  const viaRole = extractFromRoleAttribute();
  if (viaRole.length > 0) return viaRole;
  return extractFromTurnFallback();
}

export function resolveThreadId(): string | null {
  const match = location.pathname.match(/\/c\/([0-9a-fA-F-]{36})/);
  return match ? match[1] : null;
}
