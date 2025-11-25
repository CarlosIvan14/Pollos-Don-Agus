'use client';

import { useState, FormEvent } from 'react';
import useSWR from 'swr';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Order = any; // si ya tienes tipo, reutilízalo

type InventoryItem = {
  _id: string;
  name: string;
  category: string;
  unit: string;
  currentQty: number;
  minQty: number;
  maxQty?: number | null;
  supplierName?: string;
  supplierPhone?: string;
  supplierNotes?: string;
  isActive: boolean;
};

const emptyNewItem: Omit<InventoryItem, '_id'> = {
  name: '',
  category: 'otro',
  unit: 'pieza',
  currentQty: 0,
  minQty: 0,
  maxQty: null,
  supplierName: '',
  supplierPhone: '',
  supplierNotes: '',
  isActive: true,
};

export default function Admin() {
  const { data: orders } = useSWR<Order[]>('/api/orders', fetcher, {
    refreshInterval: 5000,
  });

  const {
    data: inventory,
    mutate: refreshInventory,
    isLoading: loadingInventory,
  } = useSWR<InventoryItem[]>('/api/inventory', fetcher);

  const [newItem, setNewItem] = useState(emptyNewItem);
  const [savingNew, setSavingNew] = useState(false);

  async function adjustStock(id: string, delta: number) {
    if (!inventory) return;
    const item = inventory.find((i) => i._id === id);
    if (!item) return;

    const nextQty = Math.max(0, item.currentQty + delta);

    await fetch(`/api/inventory/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentQty: nextQty }),
    });

    refreshInventory();
  }

  async function handleCreateItem(e: FormEvent) {
    e.preventDefault();
    setSavingNew(true);
    await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    });
    setSavingNew(false);
    setNewItem(emptyNewItem);
    refreshInventory();
  }

  function categoryLabel(cat: string) {
    switch (cat) {
      case 'pollo':
        return 'Pollos';
      case 'aderezo':
        return 'Aderezos';
      case 'envase':
        return 'Envases';
      case 'combustible':
        return 'Leña / gas';
      case 'ingrediente':
        return 'Ingredientes';
      default:
        return 'Otros';
    }
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
    <main className="grid gap-4">
      {/* Pedidos recientes */}
      <section className="card">
        <h2 className="text-xl font-semibold">Pedidos recientes</h2>
        <div className="grid gap-2 mt-3">
          {(orders || []).map((o: any) => (
            <div
              key={o._id}
              className="grid md:grid-cols-6 gap-2 items-center bg-black/20 rounded-xl p-3"
            >
              <div className="font-semibold">
                {new Date(o.createdAt).toLocaleTimeString()}
              </div>
              <div className="text-sm">{o.source}</div>
              <div className="text-sm">
                {o.delivery ? 'Domicilio' : 'Local'}
              </div>
              <div className="text-sm">
                {o.items.map((it: any) => `${it.qty}x ${it.kind}`).join(', ')}
              </div>
              <div className="font-bold">${o.total}</div>
              <div className="text-sm">{o.customer?.phone || '-'}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Inventario y alertas */}
      <section className="card">
        <h2 className="text-xl font-semibold mb-3">
          Inventario de insumos & alertas
        </h2>

        {loadingInventory && <p className="text-sm text-zinc-400">Cargando…</p>}

        {!loadingInventory && (!inventory || inventory.length === 0) && (
          <p className="text-sm text-zinc-400">
            Aún no tienes insumos registrados. Empieza agregando alguno abajo
            (pollos, aderezos, contenedores, leña, etc.).
          </p>
        )}

        {inventory && inventory.length > 0 && (
          <div className="overflow-x-auto border border-zinc-800 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-black/40">
                <tr>
                  <th className="px-3 py-2 text-left">Insumo</th>
                  <th className="px-3 py-2 text-left">Categoría</th>
                  <th className="px-3 py-2 text-right">Stock</th>
                  <th className="px-3 py-2 text-right">Mínimo</th>
                  <th className="px-3 py-2 text-left">Proveedor</th>
                  <th className="px-3 py-2 text-left">Contacto</th>
                  <th className="px-3 py-2 text-left">Notas</th>
                  <th className="px-3 py-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => {
                  const low = item.currentQty <= item.minQty;
                  return (
                    <tr
                      key={item._id}
                      className={low ? 'bg-red-500/10' : 'bg-black/10'}
                    >
                      <td className="px-3 py-2 font-medium">{item.name}</td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-1 rounded-full bg-black/40 text-xs">
                          {categoryLabel(item.category)}
                        </span>
                        {low && (
                          <span className="ml-2 px-2 py-1 rounded-full bg-red-600/70 text-xs font-semibold">
                            Bajo stock
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {item.currentQty} {item.unit}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {item.minQty} {item.unit}
                      </td>
                      <td className="px-3 py-2">{item.supplierName || '-'}</td>
                      <td className="px-3 py-2">
                        {item.supplierPhone ? (
                          <a
                            href={`tel:${item.supplierPhone}`}
                            className="underline"
                          >
                            {item.supplierPhone}
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-3 py-2 max-w-xs truncate">
                        {item.supplierNotes || '-'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => adjustStock(item._id, -1)}
                            className="px-2 py-1 rounded-lg bg-black/60 text-xs"
                          >
                            -1
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustStock(item._id, 1)}
                            className="px-2 py-1 rounded-lg bg-black/60 text-xs"
                          >
                            +1
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Formulario para agregar nuevo insumo */}
        <div className="mt-6 border-t border-zinc-800 pt-4">
          <h3 className="font-semibold mb-2 text-lg">Nuevo insumo</h3>
          <p className="text-xs text-zinc-400 mb-3">
            Usa esto para registrar cosas como pollos, aderezos, contenedores
            8x8, bolsas, leña, etc. Luego podrás ir ajustando el stock con los
            botones rápidos.
          </p>

          <form
            onSubmit={handleCreateItem}
            className="grid md:grid-cols-4 gap-3 text-sm"
          >
            <input
              className="input bg-black/40"
              placeholder="Nombre del insumo (ej. Lata chiles chipotles 2½ kg)"
              value={newItem.name}
              onChange={(e) =>
                setNewItem((v) => ({ ...v, name: e.target.value }))
              }
              required
            />

            <select
              className="input bg-black/40"
              value={newItem.category}
              onChange={(e) =>
                setNewItem((v) => ({
                  ...v,
                  category: e.target.value as InventoryItem['category'],
                }))
              }
            >
              <option value="pollo">Pollos</option>
              <option value="aderezo">Aderezos</option>
              <option value="envase">Envases</option>
              <option value="combustible">Leña / gas</option>
              <option value="ingrediente">Ingredientes</option>
              <option value="otro">Otro</option>
            </select>

            <input
              className="input bg-black/40"
              placeholder="Unidad (kg, pieza, lata, paquete…)"
              value={newItem.unit}
              onChange={(e) =>
                setNewItem((v) => ({ ...v, unit: e.target.value }))
              }
              required
            />

            <input
              type="number"
              min={0}
              step={0.01}
              className="input bg-black/40"
              placeholder="Stock actual"
              value={newItem.currentQty}
              onChange={(e) =>
                setNewItem((v) => ({
                  ...v,
                  currentQty: Number(e.target.value),
                }))
              }
              required
            />

            <input
              type="number"
              min={0}
              step={0.01}
              className="input bg-black/40"
              placeholder="Stock mínimo para alerta"
              value={newItem.minQty}
              onChange={(e) =>
                setNewItem((v) => ({ ...v, minQty: Number(e.target.value) }))
              }
              required
            />

            <input
              type="number"
              min={0}
              step={0.01}
              className="input bg-black/40"
              placeholder="Stock objetivo (opcional)"
              value={newItem.maxQty ?? ''}
              onChange={(e) =>
                setNewItem((v) => ({
                  ...v,
                  maxQty: e.target.value === '' ? null : Number(e.target.value),
                }))
              }
            />

            <input
              className="input bg-black/40"
              placeholder="Proveedor (nombre)"
              value={newItem.supplierName ?? ''}
              onChange={(e) =>
                setNewItem((v) => ({ ...v, supplierName: e.target.value }))
              }
            />

            <input
              className="input bg-black/40"
              placeholder="Teléfono proveedor"
              value={newItem.supplierPhone ?? ''}
              onChange={(e) =>
                setNewItem((v) => ({ ...v, supplierPhone: e.target.value }))
              }
            />

            <textarea
              className="input bg-black/40 md:col-span-4"
              placeholder="Notas de compra (ej. precio, dónde se compra, etc.)"
              value={newItem.supplierNotes ?? ''}
              onChange={(e) =>
                setNewItem((v) => ({ ...v, supplierNotes: e.target.value }))
              }
              rows={2}
            />

            <button
              type="submit"
              disabled={savingNew}
              className="md:col-span-4 mt-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-sm"
            >
              {savingNew ? 'Guardando…' : 'Agregar insumo'}
            </button>
          </form>
        </div>
      </section>
    </main>
    </ProtectedRoute>
  );
}
