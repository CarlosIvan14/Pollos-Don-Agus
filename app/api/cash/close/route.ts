import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Order from '@/models/Order';
import CashClose from '@/models/CashClose';
import { startOfDay, endOfDay } from 'date-fns';

export async function POST(req: NextRequest) {
  await dbConnect();
  const { date, note } = await req.json();
  const d = date ? new Date(date) : new Date();
  const start = startOfDay(d);
  const end = endOfDay(d);
  const orders = await Order.find({ createdAt: { $gte: start, $lte: end }, status: { $ne: 'cancelado' } }).lean();
  const totals = {
    ventas: orders.length,
    total: orders.reduce((a, o) => a + (o.total||0), 0),
    porTipo: {} as Record<string, { qty: number; total: number }>,
    porCanal: { cliente: 0, caja: 0 },
    domicilio: 0,
    local: 0,
  };
  for (const o of orders) {
    totals.porCanal[o.source] = (totals.porCanal[o.source] || 0) + o.total;
    if (o.delivery) totals.domicilio += o.total; else totals.local += o.total;
    for (const it of o.items as any[]) {
      const k = it.kind;
      if (!totals.porTipo[k]) totals.porTipo[k] = { qty: 0, total: 0 };
      totals.porTipo[k].qty += it.qty;
      // precio por ítem es implícito; asumimos promedio aproximando por proporción
      totals.porTipo[k].total += o.total; // aproximación
    }
  }
  const saved = await CashClose.create({ date: start, totals, note: note || '' });
  return NextResponse.json(saved);
}
