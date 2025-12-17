// app/api/menu/styles/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Style from '@/models/Style';
import { Types } from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// GET: Obtener un estilo específico
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    if (!Types.ObjectId.isValid(params.id)) {
      return jsonError('ID inválido', 400);
    }

    const style = await Style.findById(params.id).lean();
    if (!style) {
      return jsonError('Estilo no encontrado', 404);
    }

    return NextResponse.json(style, { status: 200 });
  } catch (err: any) {
    console.error('GET /api/menu/styles/[id] error:', err);
    return jsonError(err?.message || 'Error al obtener estilo', 500);
  }
}

// PATCH: Actualizar estilo
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
    if (body.name !== undefined) updateData.name = body.name.toLowerCase().trim();
    if (body.displayName !== undefined) updateData.displayName = body.displayName.trim();
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.sortOrder !== undefined) updateData.sortOrder = Number(body.sortOrder);

    const style = await Style.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    if (!style) {
      return jsonError('Estilo no encontrado', 404);
    }

    return NextResponse.json(style, { status: 200 });
  } catch (err: any) {
    console.error('PATCH /api/menu/styles/[id] error:', err);
    return jsonError(err?.message || 'Error al actualizar estilo', 500);
  }
}

// DELETE: Eliminar estilo
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    if (!Types.ObjectId.isValid(params.id)) {
      return jsonError('ID inválido', 400);
    }

    const style = await Style.findByIdAndDelete(params.id);
    if (!style) {
      return jsonError('Estilo no encontrado', 404);
    }

    return NextResponse.json({ message: 'Estilo eliminado' }, { status: 200 });
  } catch (err: any) {
    console.error('DELETE /api/menu/styles/[id] error:', err);
    return jsonError(err?.message || 'Error al eliminar estilo', 500);
  }
}

