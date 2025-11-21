import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Order from '@/models/Order';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// -----------------------------
// GET /api/orders/:id
// -----------------------------
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const order = await Order.findById(params.id).lean();

    if (!order) return jsonError('Orden no encontrada', 404);

    return NextResponse.json(order);
  } catch (err: any) {
    console.error('GET /api/orders/[id] error:', err);
    return jsonError(err?.message || 'Error al obtener orden', 500);
  }
}

// -----------------------------
// PATCH /api/orders/:id
// -----------------------------
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();

    const body = await req.json().catch(() => null);
    if (!body) return jsonError('JSON malformado', 400);

    const updated = await Order.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true }
    ).lean();

    if (!updated) return jsonError('Orden no encontrada', 404);

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('PATCH /api/orders/[id] error:', err);
    return jsonError(err?.message || 'Error al actualizar orden', 500);
  }
}

// -----------------------------
// DELETE /api/orders/:id
// -----------------------------
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();

    const deleted = await Order.findByIdAndDelete(params.id).lean();
    if (!deleted) return jsonError('Orden no encontrada', 404);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('DELETE /api/orders/[id] error:', err);
    return jsonError(err?.message || 'Error al eliminar orden', 500);
  }
}
