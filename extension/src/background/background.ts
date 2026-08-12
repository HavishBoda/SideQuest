import { SIDEQUEST_TRIGGER, type SideQuestTriggerResponse, type PendingQuery } from "../lib/messaging";

const CONTEXT_MENU_ID = "sidequest-ask";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: "SideQuest: ask about this",
    contexts: ["selection"],
    documentUrlPatterns: ["https://chatgpt.com/*"],
  });
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
});

// sidePanel.open() must run as the direct result of the user gesture that
// triggered this handler - keep it first, before any other awaits.
async function triggerSideQuery(tabId: number) {
  await chrome.sidePanel.open({ tabId });

  let response: SideQuestTriggerResponse | undefined;
  try {
    response = await chrome.tabs.sendMessage(tabId, { type: SIDEQUEST_TRIGGER });
  } catch {
    return; // not a chatgpt.com tab, or content script isn't loaded yet
  }
  if (!response) return;

  const pending: PendingQuery = { ...response, capturedAt: Date.now() };
  await chrome.storage.session.set({ pendingQuery: pending });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !tab?.id) return;
  void triggerSideQuery(tab.id);
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (command !== "ask-side-question" || !tab?.id) return;
  void triggerSideQuery(tab.id);
});
