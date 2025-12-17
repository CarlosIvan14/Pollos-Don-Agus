// app/api/menu/styles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Style from '@/models/Style';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// GET: Obtener todos los estilos
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('active') === 'true';

    let query: any = {};
    if (activeOnly) {
      query.isActive = true;
    }

    const styles = await Style.find(query)
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return NextResponse.json(styles, { status: 200 });
  } catch (err: any) {
    console.error('GET /api/menu/styles error:', err);
    return jsonError(err?.message || 'Error al obtener estilos', 500);
  }
}

// POST: Crear nuevo estilo
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json().catch(() => null);
    if (!body) return jsonError('JSON malformado.', 400);

    const { name, displayName, sortOrder } = body;

    if (!name || !displayName) {
      return jsonError('Faltan campos requeridos: name, displayName', 400);
    }

    const style = await Style.create({
      name: name.toLowerCase().trim(),
      displayName: displayName.trim(),
      isActive: body.isActive !== undefined ? body.isActive : true,
      sortOrder: sortOrder || 0,
    });

    return NextResponse.json(style, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/menu/styles error:', err);
    if (err.code === 11000) {
      return jsonError('Ya existe un estilo con ese nombre', 400);
    }
    return jsonError(err?.message || 'Error al crear estilo', 500);
  }
}

