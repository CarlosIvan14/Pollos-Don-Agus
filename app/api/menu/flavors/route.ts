// app/api/menu/flavors/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Flavor from '@/models/Flavor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// GET: Obtener todos los sabores
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('active') === 'true';

    let query: any = {};
    if (activeOnly) {
      query.isActive = true;
    }

    const flavors = await Flavor.find(query)
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return NextResponse.json(flavors, { status: 200 });
  } catch (err: any) {
    console.error('GET /api/menu/flavors error:', err);
    return jsonError(err?.message || 'Error al obtener sabores', 500);
  }
}

// POST: Crear nuevo sabor
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json().catch(() => null);
    if (!body) return jsonError('JSON malformado.', 400);

    const { name, price, sortOrder } = body;

    if (!name || price === undefined) {
      return jsonError('Faltan campos requeridos: name, price', 400);
    }

    const flavor = await Flavor.create({
      name: name.trim(),
      price: Number(price),
      isActive: body.isActive !== undefined ? body.isActive : true,
      sortOrder: sortOrder || 0,
    });

    return NextResponse.json(flavor, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/menu/flavors error:', err);
    if (err.code === 11000) {
      return jsonError('Ya existe un sabor con ese nombre', 400);
    }
    return jsonError(err?.message || 'Error al crear sabor', 500);
  }
}

