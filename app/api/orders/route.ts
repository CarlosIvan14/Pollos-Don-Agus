import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Order from '@/models/Order';
import { broadcast } from '@/lib/sse';
import { orderTotal, canDeliver, OrderItem } from '@/lib/pricing';
// si usas inventario automático, vuelve a importar esto:
// import { aplicarInventarioParaOrden } from '@/lib/inventory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    await dbConnect();
    const list = await Order.find().sort({ createdAt: -1 }).limit(100).lean();
    return NextResponse.json(list, { status: 200 });
  } catch (err: any) {
    console.error('GET /api/orders error:', err);
    return jsonError(err?.message || 'Error al listar pedidos', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ct = req.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      return jsonError('Content-Type inválido. Usa application/json.', 415);
    }

    await dbConnect();

    const body = await req.json().catch(() => null);
    if (!body) return jsonError('JSON malformado.', 400);

    const items: OrderItem[] = Array.isArray(body.items) ? body.items : [];
    const delivery = !!body.delivery;
    const tortillasPacks = Math.max(0, body.tortillasPacks | 0);

    if (!items.length) return jsonError('Sin artículos', 400);

    if (delivery && !canDeliver(items)) {
      return jsonError(
        'Para envío a domicilio se requiere: 1 pollo completo, 1 costillar (normal/grande) o combo de 1/2 pollo + 1/2 costillar.',
        400
      );
    }

    const total = orderTotal(items, delivery, tortillasPacks);

    // 🔻 NUEVO: status inicial según origen y si es domicilio
    const source: 'cliente' | 'caja' = body.source || 'cliente';
    const initialStatus =
      source === 'caja' && !delivery ? 'entregado' : 'pendiente';

    const order = await Order.create({
      source,
      items,
      delivery,
      tortillasPacks,
      total,
      customer: body.customer || {},
      cashierId: body.cashierId || null,
      createdAt: new Date(),
      status: initialStatus,
    });

    // si usas inventario automático, descomenta:
    // try {
    //   await aplicarInventarioParaOrden(items);
    // } catch (invErr) {
    //   console.error('Error al aplicar inventario:', invErr);
    // }

    broadcast({
      type: 'nueva_orden',
      orderId: String(order._id),
      total,
      ts: Date.now(),
    });

    return NextResponse.json(order, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/orders error:', err);
    return jsonError(err?.message || 'Error al registrar pedido', 500);
  }
}
