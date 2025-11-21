// lib/pricing.ts
export type ItemKind = 'pollo'|'medio_pollo'|'costillar_medio'|'costillar_normal'|'costillar_grande'|'alitas'|'lechon';
export type PricingInput = {
  kind: ItemKind;
  qty: number;
  delivery: boolean;
  overridePrice?: number;
};

export const BASE_PICKUP = {
  pollo: 200,
  medio_pollo: 100,
  costillar_medio: 100,
  costillar_normal: 200,
  costillar_grande: 250,
  alitas: 180,
  lechon: 300,
} as const;

// ✅ Envío fijo por pedido:
export const DELIVERY_SURCHARGE_PER_ORDER = 20;

export function priceFor(item: PricingInput): number {
  // ya NO sumamos recargo por unidad aquí
  const base = (item.overridePrice ?? BASE_PICKUP[item.kind]) * item.qty;
  return base;
}

export type OrderItem = {
  kind: ItemKind;
  qty: number;
  flavor?: string;
  chickenStyle?: 'asado'|'rostizado';
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

export function orderTotal(items: OrderItem[], delivery: boolean, tortillasPacks: number): number {
  const itemsTotal = items.reduce((sum, it) => sum + priceFor({ kind: it.kind, qty: it.qty, delivery, overridePrice: it.overridePrice }), 0);
  const tortillas = Math.max(0, tortillasPacks|0) * 10;
  const deliveryFee = delivery ? DELIVERY_SURCHARGE_PER_ORDER : 0; // ✅ fijo por pedido
  return itemsTotal + deliveryFee + tortillas;
}
