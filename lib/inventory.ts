import InventoryItem from '@/models/InventoryItem';
import { OrderItem } from './pricing';

/**
 * Calcula cuántos pollos crudos consume un ítem del pedido.
 * ADÁPTALO a los nombres reales de tu menú.
 */
function pollosConsumidosPorItem(it: OrderItem): number {
  const k = (it.kind || '').toLowerCase();

  let pollosUnidad = 0;

  // Ejemplos: cámbialos por tus textos reales
  if (k.includes('combo') && k.includes('1/2 pollo')) {
    // combo medio pollo + algo
    pollosUnidad = 0.5;
  } else if (k.includes('medio pollo') || k.includes('1/2 pollo')) {
    pollosUnidad = 0.5;
  } else if (k.includes('pollo entero') || k === 'pollo' || k.includes('pollo asado')) {
    pollosUnidad = 1;
  } else {
    pollosUnidad = 0; // productos que no llevan pollo
  }

  return pollosUnidad * (it.qty || 0);
}

/**
 * Dado el arreglo de items de una orden, descuenta del inventario
 * el total de pollos usados.
 */
export async function aplicarInventarioParaOrden(items: OrderItem[]) {
  if (!items?.length) return;

  // Calcula pollos totales usados en la orden
  const pollosTotales = items.reduce(
    (acc, it) => acc + pollosConsumidosPorItem(it),
    0
  );

  if (!pollosTotales) return;

  // Busca el item de inventario de pollos
  const polloInv = await InventoryItem.findOne({
    category: 'pollo',
    isActive: true,
  });

  if (!polloInv) {
    console.warn(
      '[inventario] No se encontró item de inventario con category="pollo"'
    );
    return;
  }

  // No dejar que se vaya a negativo
  polloInv.currentQty = Math.max(0, polloInv.currentQty - pollosTotales);
  await polloInv.save();
}
