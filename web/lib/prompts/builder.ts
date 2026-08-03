export function buildPrompt({
  question,
  context,
}: {
  question: string;
  context: string;
}) {

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