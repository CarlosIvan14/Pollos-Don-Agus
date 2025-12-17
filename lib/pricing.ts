// lib/pricing.ts
import { dbConnect } from './db';
import MenuProduct, { IMenuProduct } from '@/models/MenuProduct';
import Flavor, { IFlavor } from '@/models/Flavor';

export type ItemKind = 'pollo'|'medio_pollo'|'costillar_medio'|'costillar_normal'|'costillar_grande'|'alitas'|'lechon';
export type PricingInput = {
  kind: ItemKind;
  qty: number;
  delivery: boolean;
  overridePrice?: number;
  flavorId?: string; // ID del sabor (opcional, para calcular precio adicional)
};

// ✅ Envío fijo por pedido:
export const DELIVERY_SURCHARGE_PER_ORDER = 20;
export const TORTILLAS_PRICE_PER_PACK = 10;

// Cache para productos (se puede mejorar con Redis en producción)
let productsCache: Map<string, { price: number; updatedAt: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

async function getProductPrice(kind: ItemKind): Promise<number> {
  const cached = productsCache.get(kind);
  if (cached && Date.now() - cached.updatedAt < CACHE_TTL) {
    return cached.price;
  }

  await dbConnect();
  const product = await MenuProduct.findOne({ code: kind, isActive: true }).lean() as IMenuProduct | null;
  
  if (!product) {
    // Fallback a precios por defecto si no existe en DB
    const defaults: Record<ItemKind, number> = {
      pollo: 200,
      medio_pollo: 100,
      costillar_medio: 100,
      costillar_normal: 200,
      costillar_grande: 250,
      alitas: 180,
      lechon: 300,
    };
    return defaults[kind] || 0;
  }

  productsCache.set(kind, { price: product.price, updatedAt: Date.now() });
  return product.price;
}

async function getFlavorPrice(flavorId?: string): Promise<number> {
  if (!flavorId) return 0;
  
  await dbConnect();
  const flavor = await Flavor.findById(flavorId).lean() as IFlavor | null;
  return flavor?.price || 0;
}

export async function priceFor(item: PricingInput): Promise<number> {
  if (item.overridePrice !== undefined) {
    return item.overridePrice * item.qty;
  }

  const basePrice = await getProductPrice(item.kind);
  const flavorPrice = item.flavorId ? await getFlavorPrice(item.flavorId) : 0;
  
  return (basePrice + flavorPrice) * item.qty;
}

export type OrderItem = {
  kind: ItemKind;
  qty: number;
  flavor?: string; // Nombre del sabor (para compatibilidad)
  flavorId?: string; // ID del sabor (preferido)
  chickenStyle?: 'asado'|'rostizado'; // Nombre del estilo (para compatibilidad)
  styleId?: string; // ID del estilo (preferido)
  productId?: string; // ID del producto del menú
  overridePrice?: number;
};

export function canDeliver(items: OrderItem[]): boolean {
  const count = (k: ItemKind) => items.reduce((a, it) => a + (it.kind === k ? it.qty : 0), 0);
  const fullChickens = count('pollo');
  const fullRibs = count('costillar_normal') + count('costillar_grande');
  const halfChicken = count('medio_pollo');
  const halfRibs = count('costillar_medio');
  if (fullChickens >= 1) return true;
  if (fullRibs >= 1) return true;
  if (halfChicken >= 1 && halfRibs >= 1) return true;
  return false;
}

export async function orderTotal(items: OrderItem[], delivery: boolean, tortillasPacks: number): Promise<number> {
  let itemsTotal = 0;
  for (const it of items) {
    const itemPrice = await priceFor({
      kind: it.kind,
      qty: it.qty,
      delivery,
      overridePrice: it.overridePrice,
      flavorId: it.flavorId,
    });
    itemsTotal += itemPrice;
  }
  
  const tortillas = Math.max(0, tortillasPacks|0) * TORTILLAS_PRICE_PER_PACK;
  const deliveryFee = delivery ? DELIVERY_SURCHARGE_PER_ORDER : 0; // ✅ fijo por pedido
  return itemsTotal + deliveryFee + tortillas;
}
