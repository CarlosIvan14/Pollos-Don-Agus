// app/api/menu/active/route.ts
// API para obtener el menú activo completo (productos, sabores, estilos)
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import MenuProduct from '@/models/MenuProduct';
import Flavor from '@/models/Flavor';
import Style from '@/models/Style';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();

    const [products, flavors, styles] = await Promise.all([
      MenuProduct.find({ isActive: true })
        .populate('availableFlavors', 'name price isActive')
        .populate('availableStyles', 'name displayName isActive')
        .sort({ sortOrder: 1, name: 1 })
        .lean(),
      Flavor.find({ isActive: true })
        .sort({ sortOrder: 1, name: 1 })
        .lean(),
      Style.find({ isActive: true })
        .sort({ sortOrder: 1, name: 1 })
        .lean(),
    ]);

    return NextResponse.json(
      {
        products,
        flavors,
        styles,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('GET /api/menu/active error:', err);
    return NextResponse.json(
      { error: err?.message || 'Error al obtener menú activo' },
      { status: 500 }
    );
  }
}

