import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import InventoryItem from '@/models/InventoryItem';

export async function GET() {
  await dbConnect();
  const items = await InventoryItem.find().sort({ category: 1, name: 1 }).lean();
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  await dbConnect();
  const body = await req.json();

  try {
    const item = await InventoryItem.create(body);
    return NextResponse.json(item, { status: 201 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { message: 'Error creando insumo', details: err.message },
      { status: 400 }
    );
  }
}
