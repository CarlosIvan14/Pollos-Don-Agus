import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import InventoryItem from '@/models/InventoryItem';

interface Params {
  params: { id: string };
}

export async function GET(_req: Request, { params }: Params) {
  await dbConnect();
  const item = await InventoryItem.findById(params.id).lean();
  if (!item) {
    return NextResponse.json({ message: 'Insumo no encontrado' }, { status: 404 });
  }
  return NextResponse.json(item);
}

// PATCH sirve para editar o ajustar stock
export async function PATCH(req: Request, { params }: Params) {
  await dbConnect();
  const data = await req.json();

  try {
    const item = await InventoryItem.findByIdAndUpdate(
      params.id,
      { $set: data },
      { new: true }
    ).lean();

    if (!item) {
      return NextResponse.json({ message: 'Insumo no encontrado' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { message: 'Error actualizando insumo', details: err.message },
      { status: 400 }
    );
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  await dbConnect();
  await InventoryItem.findByIdAndDelete(params.id);
  return NextResponse.json({ ok: true });
}
