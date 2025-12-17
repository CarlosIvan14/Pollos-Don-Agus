// app/api/menu/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import MenuProduct from '@/models/MenuProduct';
import Flavor from '@/models/Flavor';
import Style from '@/models/Style';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// GET: Obtener todos los productos del menú (con opción de solo activos)
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('active') === 'true';

    let query: any = {};
    if (activeOnly) {
      query.isActive = true;
    }

    const products = await MenuProduct.find(query)
      .populate('availableFlavors', 'name price isActive')
      .populate('availableStyles', 'name displayName isActive')
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return NextResponse.json(products, { status: 200 });
  } catch (err: any) {
    console.error('GET /api/menu/products error:', err);
    return jsonError(err?.message || 'Error al obtener productos', 500);
  }
}

// POST: Crear nuevo producto del menú
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json().catch(() => null);
    if (!body) return jsonError('JSON malformado.', 400);

    const { code, name, description, price, availableFlavors, availableStyles, showOnlyInStore, sortOrder } = body;

    if (!code || !name || price === undefined) {
      return jsonError('Faltan campos requeridos: code, name, price', 400);
    }

    const product = await MenuProduct.create({
      code: code.toLowerCase().trim(),
      name,
      description,
      price: Number(price),
      isActive: body.isActive !== undefined ? body.isActive : true,
      availableFlavors: availableFlavors || [],
      availableStyles: availableStyles || [],
      showOnlyInStore: showOnlyInStore || false,
      sortOrder: sortOrder || 0,
    });

    const populated = await MenuProduct.findById(product._id)
      .populate('availableFlavors', 'name price isActive')
      .populate('availableStyles', 'name displayName isActive')
      .lean();

    return NextResponse.json(populated, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/menu/products error:', err);
    if (err.code === 11000) {
      return jsonError('Ya existe un producto con ese código', 400);
    }
    return jsonError(err?.message || 'Error al crear producto', 500);
  }
}

