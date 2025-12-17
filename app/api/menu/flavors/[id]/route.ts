// app/api/menu/flavors/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Flavor from '@/models/Flavor';
import { Types } from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// GET: Obtener un sabor específico
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    if (!Types.ObjectId.isValid(params.id)) {
      return jsonError('ID inválido', 400);
    }

    const flavor = await Flavor.findById(params.id).lean();
    if (!flavor) {
      return jsonError('Sabor no encontrado', 404);
    }

    return NextResponse.json(flavor, { status: 200 });
  } catch (err: any) {
    console.error('GET /api/menu/flavors/[id] error:', err);
    return jsonError(err?.message || 'Error al obtener sabor', 500);
  }
}

// PATCH: Actualizar sabor
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    if (!Types.ObjectId.isValid(params.id)) {
      return jsonError('ID inválido', 400);
    }

    const body = await req.json().catch(() => null);
    if (!body) return jsonError('JSON malformado.', 400);

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.sortOrder !== undefined) updateData.sortOrder = Number(body.sortOrder);

    const flavor = await Flavor.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    if (!flavor) {
      return jsonError('Sabor no encontrado', 404);
    }

    return NextResponse.json(flavor, { status: 200 });
  } catch (err: any) {
    console.error('PATCH /api/menu/flavors/[id] error:', err);
    return jsonError(err?.message || 'Error al actualizar sabor', 500);
  }
}

// DELETE: Eliminar sabor
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    if (!Types.ObjectId.isValid(params.id)) {
      return jsonError('ID inválido', 400);
    }

    const flavor = await Flavor.findByIdAndDelete(params.id);
    if (!flavor) {
      return jsonError('Sabor no encontrado', 404);
    }

    return NextResponse.json({ message: 'Sabor eliminado' }, { status: 200 });
  } catch (err: any) {
    console.error('DELETE /api/menu/flavors/[id] error:', err);
    return jsonError(err?.message || 'Error al eliminar sabor', 500);
  }
}

