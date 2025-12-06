// lib/inventory.ts
import Product from '@/models/Product';
import type { OrderItem } from './pricing';

/**
 * Mapa de consumo: para cada "code" de Product,
 * cuántas unidades vamos a descontar.
 *
 * IMPORTANTE:
 *  - Debes tener productos en la BD con estos codes:
 *      - "pollo"             → pollos crudos (en piezas)
 *      - "costillar_normal"  → costillar normal crudo
 *      - "costillar_grande"  → costillar grande crudo
 *
 *  - Ajusta los codes si en tu BD usaste otros (ej. "pollo_crudo").
 */
function buildConsumptionMap(items: OrderItem[]): Record<string, number> {
  const map: Record<string, number> = {};

  const add = (code: string, qty: number) => {
    if (!qty) return;
    map[code] = (map[code] ?? 0) + qty;
  };

  for (const it of items) {
    const qty = it.qty ?? 0;

    switch (it.kind) {
      case 'pollo':
        // 1 pollo entero
        add('pollo', qty * 1);
        break;

      case 'medio_pollo':
        // medio pollo
        add('pollo', qty * 0.5);
        break;

      case 'costillar_medio':
        // medio costillar → 0.5 de costillar normal
        // si prefieres tener un producto distinto (code "costillar_medio"),
        // cámbialo aquí.
        add('costillar_normal', qty * 0.5);
        break;

      case 'costillar_normal':
        // costillar normal completo
        add('costillar_normal', qty * 1);
        break;

      case 'costillar_grande':
        // costillar grande completo
        add('costillar_grande', qty * 1);
        break;

      default:
        // otros productos del menú que no afectan inventario base
        break;
    }
  }

  return map;
}

/**
 * Aplica el consumo de inventario para una orden:
 * - Descuenta pollos crudos
 * - Descuenta costillares (medio / normal / grande)
 */
export async function aplicarInventarioParaOrden(items: OrderItem[]) {
  if (!items?.length) return;

  const consumos = buildConsumptionMap(items);
  const codes = Object.keys(consumos);
  if (!codes.length) return;

  // Traemos todos los productos afectados de una sola vez
  const productos = await Product.find({
    code: { $in: codes },
    isActive: true,
  });

  if (!productos.length) {
    console.warn(
      '[inventario] No se encontraron productos con codes:',
      codes
    );
    return;
  }

  for (const prod of productos) {
    const toSubtract = consumos[prod.code as string] ?? 0;
    if (!toSubtract) continue;

    const before = prod.currentQty ?? 0;
    const after = Math.max(0, before - toSubtract);

    prod.currentQty = after;
    await prod.save();
  }
}
