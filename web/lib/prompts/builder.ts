export function buildPrompt({
  question,
  context,
  selectedText,
}: {
  question: string;
  context: string;
  selectedText?: string;
}) {
  if (selectedText) {
    return `
You are SideQuest, an intelligent AI assistant.

Use the provided context when relevant.
If the context is empty, answer normally.

Context:
${context || "(no context provided)"}

The user highlighted this excerpt from the conversation:
"""
${selectedText}
"""

Their side question about it:
${question}

Answer clearly and concisely, focused on the highlighted excerpt.
`;
  }

  return `
You are SideQuest, an intelligent AI assistant.

Use the provided context when relevant.
If the context is empty, answer normally.

Context:
${context}


User question:
${question}


Answer clearly and concisely.
`;
}