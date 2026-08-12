import { scrapeConversation, resolveThreadId } from "./scraper";
import { getSelectedText } from "./selection";
import { SIDEQUEST_TRIGGER, type SideQuestTriggerResponse } from "../lib/messaging";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== SIDEQUEST_TRIGGER) return;

  const response: SideQuestTriggerResponse = {
    threadId: resolveThreadId(),
    selectedText: getSelectedText(),
    messages: scrapeConversation(),
  };
  sendResponse(response);
});
