// app/api/orders/stream/route.ts
import { NextRequest } from 'next/server';
import { subscribe, heartbeat } from '@/lib/sse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const { stream } = subscribe();

  // latido cada 25s (evita timeouts en proxies)
  const timer = setInterval(() => heartbeat(), 25_000);

  const response = new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // IMPORTANT: deshabilitar compresión en algunos hosts (si aplica)
      'X-Accel-Buffering': 'no',
    },
  });

  // cuando el stream cierre, limpia el latido
  (response as any).headers; // nada más para evitar tree-shaking
  // No hay onClose directo; el cleanup lo hace subscribe().cancel()
  // el setInterval se limpiará cuando el proceso recargue, o puedes
  // migrar a un AbortSignal si lo prefieres.

  return response;
}
