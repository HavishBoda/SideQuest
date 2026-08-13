# SideQuest

A Chrome extension that lets you ask a side question about a ChatGPT conversation without it becoming part of the main thread.

You're deep in a chat about, say, setting up a database, and you want to ask "wait what does ACID actually mean" without derailing the conversation or losing your place. Highlight the text, hit a shortcut, ask your question in a side panel, get an answer. The main thread never sees it.

## How it works

1. You highlight some text on chatgpt.com and trigger SideQuest (keyboard shortcut or context menu).
2. A content script scrapes the current conversation and grabs your selection.
3. The extension's side panel opens, syncs the scraped messages to a local backend, and lets you type your question.
4. The backend builds a prompt (your question, the highlighted text, and however much conversation context you asked for) and sends it to a local LLM through Ollama.
5. The answer comes back into the side panel. Nothing gets written back into ChatGPT.

## Architecture decisions

**Extension + local backend, not one app.** The extension can't run a database or talk to an LLM by itself, so it's paired with a small Next.js API that runs on localhost. The extension handles scraping and UI, the backend handles storage, retrieval, and generation. Keeping them separate also means the backend could serve other frontends later without any rework.

**Everything runs locally.** Ollama for generation and embeddings, Chroma for the vector store, SQLite for conversation history. No API keys, no data leaving your machine. This was mostly about not wanting to pay per token for something that's basically a personal tool, but it also means your ChatGPT conversations stay local instead of getting piped through another provider.

**Four context modes instead of always sending everything.** When you ask a side question, you choose how much of the conversation the model should see: none, the last 10 messages, a semantic search over the whole thing, or a rolling summary. Full history isn't always relevant to a side question, and stuffing it into every prompt is slow and wastes context. Letting the mode be a per-question choice keeps it cheap by default and lets you reach for more context when the question actually needs it.

**Sync is diff-based.** Every time you open the side panel, the content script re-scrapes the whole visible conversation, but the backend only stores the messages it hasn't seen yet by comparing against what's already saved. If the scrape ever diverges from stored history (an edited or regenerated message, for example), it skips the sync instead of guessing and possibly corrupting message order.

**Summary and embeddings update in the background.** After a sync adds new messages, the backend kicks off indexing (for semantic search) and a summary refresh without blocking the response. You get your synced state back immediately instead of waiting on the heavier work to finish.

## Stack

- **Extension:** TypeScript, esbuild, Manifest V3 (content script, background service worker, side panel)
- **Backend:** Next.js (API routes only), Prisma with SQLite
- **LLM + embeddings:** Ollama, running locally
- **Vector search:** Chroma

## Running it locally

You'll need Ollama and Chroma installed, with an Ollama model and embedding model pulled (this project defaults to `llama3.2` and `mxbai-embed-large`).

```bash
# 1. start the vector store
chroma run --path web/.chroma --port 8000

# 2. make sure ollama is running
ollama serve

# 3. start the backend
cd web
npm install
npm run dev

# 4. build the extension
cd extension
npm install
npm run build
```

Then load `extension/dist` as an unpacked extension in `chrome://extensions` (Developer mode on), head to chatgpt.com, and highlight some text to try it out.
