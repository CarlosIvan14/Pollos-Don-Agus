import { NextResponse } from 'next/server';
import Product from '@/models/Product';
import { dbConnect } from '@/lib/db';

type InventorySnapshot = {
  pollo: number;
  costillar_normal: number;
  costillar_grande: number;
};

export async function GET() {
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

  return NextResponse.json(snapshot);
}
