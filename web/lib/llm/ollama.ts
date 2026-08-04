const DEFAULT_BASE_URL = "http://127.0.0.1:11434";
const DEFAULT_MODEL = "llama3.2";

type OllamaGenerateResponse = {
  response?: string;
  error?: string;
};

export class OllamaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OllamaError";
  }
}

export async function generate(prompt: string): Promise<string> {
  const baseUrl = (process.env.OLLAMA_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, "");
  const model = process.env.OLLAMA_MODEL ?? DEFAULT_MODEL;

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, stream: false }),
      signal: AbortSignal.timeout(120_000),
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown network error";
    throw new OllamaError(`Could not reach Ollama at ${baseUrl}: ${detail}`);
  }

  const payload = (await response.json().catch(() => null)) as OllamaGenerateResponse | null;
  if (!response.ok) {
    throw new OllamaError(payload?.error ?? `Ollama returned HTTP ${response.status}.`);
  }
  if (!payload?.response) {
    throw new OllamaError("Ollama returned an empty response.");
  }

  return payload.response.trim();
}

export async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch("http://localhost:11434/api/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "mxbai-embed-large",
      prompt: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama embedding request failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.embedding; // number[]
}
