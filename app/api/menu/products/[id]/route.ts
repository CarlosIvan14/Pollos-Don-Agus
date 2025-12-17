// app/api/menu/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import MenuProduct from '@/models/MenuProduct';
import { Types } from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// GET: Obtener un producto específico
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    if (!Types.ObjectId.isValid(params.id)) {
      return jsonError('ID inválido', 400);
    }

    const product = await MenuProduct.findById(params.id)
      .populate('availableFlavors', 'name price isActive')
      .populate('availableStyles', 'name displayName isActive')
      .lean();

    if (!product) {
      return jsonError('Producto no encontrado', 404);
    }

    return NextResponse.json(product, { status: 200 });
  } catch (err: any) {
    console.error('GET /api/menu/products/[id] error:', err);
    return jsonError(err?.message || 'Error al obtener producto', 500);
  }
}

// PATCH: Actualizar producto
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
    if (body.code !== undefined) updateData.code = body.code;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.availableFlavors !== undefined) updateData.availableFlavors = body.availableFlavors;
    if (body.availableStyles !== undefined) updateData.availableStyles = body.availableStyles;
    if (body.showOnlyInStore !== undefined) updateData.showOnlyInStore = body.showOnlyInStore;
    if (body.sortOrder !== undefined) updateData.sortOrder = Number(body.sortOrder);

    const product = await MenuProduct.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('availableFlavors', 'name price isActive')
      .populate('availableStyles', 'name displayName isActive')
      .lean();

    if (!product) {
      return jsonError('Producto no encontrado', 404);
    }

    return NextResponse.json(product, { status: 200 });
  } catch (err: any) {
    console.error('PATCH /api/menu/products/[id] error:', err);
    return jsonError(err?.message || 'Error al actualizar producto', 500);
  }
}

// DELETE: Eliminar producto
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    if (!Types.ObjectId.isValid(params.id)) {
      return jsonError('ID inválido', 400);
    }

    const product = await MenuProduct.findByIdAndDelete(params.id);
    if (!product) {
      return jsonError('Producto no encontrado', 404);
    }

    return NextResponse.json({ message: 'Producto eliminado' }, { status: 200 });
  } catch (err: any) {
    console.error('DELETE /api/menu/products/[id] error:', err);
    return jsonError(err?.message || 'Error al eliminar producto', 500);
  }
}

