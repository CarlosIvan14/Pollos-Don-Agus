// lib/sse.ts
const encoder = new TextEncoder();

type Client = { id: number; controller: ReadableStreamDefaultController };

function getHub() {
  const g = globalThis as any;
  if (!g.__SSE_HUB__) {
    g.__SSE_HUB__ = { clients: new Map<number, Client>(), nextId: 1 };
  }
  return g.__SSE_HUB__ as { clients: Map<number, Client>; nextId: number };
}

export function subscribe() {
  const hub = getHub();
  const id = hub.nextId++;

  const stream = new ReadableStream({
    start(controller) {
      hub.clients.set(id, { id, controller });
      // saludo inicial + primer latido
      controller.enqueue(encoder.encode(`: connected ${id}\n\n`));
      controller.enqueue(encoder.encode(`event: ping\ndata: ${Date.now()}\n\n`));
    },
    cancel() {
      hub.clients.delete(id);
    },
  });

  return { id, stream };
}

export function broadcast(event: any) {
  const hub = getHub();
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  const chunk = encoder.encode(payload);
  for (const { controller } of hub.clients.values()) {
    try {
      controller.enqueue(chunk);
    } catch {}
  }
}

// opcional: función de latidos para mantener vivos algunos proxies
export function heartbeat() {
  const hub = getHub();
  const chunk = encoder.encode(`event: ping\ndata: ${Date.now()}\n\n`);
  for (const { controller } of hub.clients.values()) {
    try {
      controller.enqueue(chunk);
    } catch {}
  }
}
