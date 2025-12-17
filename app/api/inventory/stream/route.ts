// app/api/inventory/stream/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { subscribe, broadcast } from '@/lib/sse';
import Product from '@/models/Product';
import { dbConnect } from '@/lib/db';

type InventorySnapshot = {
  pollo: number;
  costillar_normal: number;
  costillar_grande: number;
};

// Almacenar el estado del inventario en memoria (se reinicia con el servidor)
const g = globalThis as any;
if (!g.__INVENTORY_STATE__) {
  g.__INVENTORY_STATE__ = {
    current: {
      pollo: 0,
      costillar_normal: 0,
      costillar_grande: 0,
    } as InventorySnapshot,
    lastFetch: 0,
  };
}

async function fetchLatestInventory(): Promise<InventorySnapshot> {
  await dbConnect();

  const codes = ['pollo', 'costillar_normal', 'costillar_grande'] as const;

  const productos = await Product.find({
    code: { $in: codes },
    isActive: true,
  });

  const snapshot: InventorySnapshot = {
    pollo: 0,
    costillar_normal: 0,
    costillar_grande: 0,
  };

  for (const c of codes) {
    const p = productos.find((p: any) => p.code === c);
    snapshot[c] = p?.currentQty ?? 0;
  }

  return snapshot;
}

function inventoryChanged(prev: InventorySnapshot, curr: InventorySnapshot): boolean {
  return (
    prev.pollo !== curr.pollo ||
    prev.costillar_normal !== curr.costillar_normal ||
    prev.costillar_grande !== curr.costillar_grande
  );
}

export async function GET(request: NextRequest) {
  const { id, stream } = subscribe();

  // Enviar inventario inicial
  const initial = await fetchLatestInventory();
  broadcast({
    type: 'inventory_update',
    data: initial,
    timestamp: Date.now(),
  });

  // Actualizar el estado global
  g.__INVENTORY_STATE__.current = initial;
  g.__INVENTORY_STATE__.lastFetch = Date.now();

  // Polling cada 5 segundos para detectar cambios
  const pollInterval = setInterval(async () => {
    try {
      const latest = await fetchLatestInventory();
      const changed = inventoryChanged(g.__INVENTORY_STATE__.current, latest);

      if (changed) {
        g.__INVENTORY_STATE__.current = latest;
        broadcast({
          type: 'inventory_update',
          data: latest,
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      console.error('Error al actualizar inventario en SSE:', err);
    }
  }, 5000); // Revisar cada 5 segundos

  // Cleanup cuando el cliente se desconecta
  request.signal.addEventListener('abort', () => {
    clearInterval(pollInterval);
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
