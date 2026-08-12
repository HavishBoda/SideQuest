import { prisma } from "@/lib/db/client";
import { indexMessages } from "@/lib/vector";
import { updateSummary } from "@/lib/summary/updater";
import { withCors } from "@/lib/http/cors";

export const runtime = "nodejs";

type SyncMessage = { role: string; content: string };

function isSyncMessage(value: unknown): value is SyncMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as SyncMessage).role === "string" &&
    typeof (value as SyncMessage).content === "string"
  );
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return withCors(Response.json({ error: "Request body must be valid JSON." }, { status: 400 }));
  }

  const { chatgptThreadId, title, messages } = body as {
    chatgptThreadId?: unknown;
    title?: unknown;
    messages?: unknown;
  };

  if (typeof chatgptThreadId !== "string" || !chatgptThreadId.trim()) {
    return withCors(Response.json({ error: "chatgptThreadId must be a non-empty string." }, { status: 400 }));
  }
  if (typeof title !== "undefined" && typeof title !== "string") {
    return withCors(Response.json({ error: "title must be a string." }, { status: 400 }));
  }
  if (!Array.isArray(messages) || !messages.every(isSyncMessage)) {
    return withCors(Response.json({ error: "messages must be an array of {role, content}." }, { status: 400 }));
  }

  const threadId = chatgptThreadId.trim();
  const incoming = messages;

  const conversation = await prisma.conversation.upsert({
    where: { id: threadId },
    update: {},
    create: {
      id: threadId,
      title: (title as string | undefined)?.trim() || incoming[0]?.content.slice(0, 80) || "Untitled",
    },
  });

  const existing = await prisma.message.findMany({
    where: { conversationId: threadId },
    orderBy: { createdAt: "asc" },
    select: { role: true, content: true },
  });

  // Only the suffix of `incoming` that isn't already stored gets appended.
  // A mismatch inside the overlap means the DOM scrape diverged from history
  // (edited/regenerated messages) - skip rather than risk corrupting order.
  let overlap = 0;
  const compareLen = Math.min(existing.length, incoming.length);
  for (; overlap < compareLen; overlap++) {
    if (existing[overlap].role !== incoming[overlap].role || existing[overlap].content !== incoming[overlap].content) {
      break;
    }
  }

  if (overlap < existing.length) {
    return withCors(
      Response.json({
        conversationId: conversation.id,
        newMessageCount: 0,
        totalMessageCount: existing.length,
        warning: "Incoming messages diverge from stored history; skipped sync to avoid overwriting.",
      }),
    );
  }

  const newMessages = incoming.slice(overlap);
  const createdRows = [];
  const baseTime = Date.now();
  for (let i = 0; i < newMessages.length; i++) {
    const message = newMessages[i];
    createdRows.push(
      await prisma.message.create({
        data: {
          conversationId: threadId,
          role: message.role,
          content: message.content,
          createdAt: new Date(baseTime + i),
        },
      }),
    );
  }

  if (createdRows.length > 0) {
    void indexMessages(
      createdRows.map((row) => ({
        conversationId: threadId,
        messageId: row.id,
        role: row.role,
        content: row.content,
      })),
    ).catch((error) => console.error("indexMessages failed", error));

    void updateSummary(threadId).catch((error) => console.error("updateSummary failed", error));
  }

  return withCors(
    Response.json({
      conversationId: conversation.id,
      newMessageCount: newMessages.length,
      totalMessageCount: existing.length + newMessages.length,
    }),
  );
}

export async function OPTIONS() {
  return withCors(new Response(null, { status: 204 }));
}
