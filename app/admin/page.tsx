// app/admin/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import useSWR from 'swr';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Order = any;

type Product = {
  _id: string;
  code: string;
  name: string;
  category: string;
  unit: string;   // kg, pieza, l, g, paquete...
  step: number;   // 0.25, 0.5, 1, 2.5, etc.
  currentQty: number;
  minQty: number;
  maxQty?: number | null;
  supplierName?: string;
  supplierPhone?: string;
  supplierNotes?: string;
  isActive: boolean;
};

const emptyNewProduct: Omit<Product, '_id'> = {
  code: '',
  name: '',
  category: 'otro',
  unit: 'pieza',
  step: 1,
  currentQty: 0,
  minQty: 0,
  maxQty: null,
  supplierName: '',
  supplierPhone: '',
  supplierNotes: '',
  isActive: true,
};

function categoryLabel(cat: string) {
  switch (cat) {
    case 'pollo':
      return 'Pollos';
    case 'costillar':
      return 'costillar';
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

function AdminInner() {
  const { data: orders } = useSWR<Order[]>('/api/orders', fetcher, {
    refreshInterval: 5000,
  });

  const {
    data: products,
    mutate: refreshProducts,
    isLoading: loadingProducts,
  } = useSWR<Product[]>('/api/inventory', fetcher);

  const [newProduct, setNewProduct] = useState(emptyNewProduct);
  const [savingNew, setSavingNew] = useState(false);

  async function adjustStock(id: string, direction: 'inc' | 'dec') {
    if (!products) return;
    const item = products.find((i) => i._id === id);
    if (!item) return;

    const step = item.step || 1;
    const delta = direction === 'inc' ? step : -step;
    const nextQty = Math.max(0, item.currentQty + delta);

    await fetch(`/api/inventory/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentQty: nextQty }),
    });

    refreshProducts();
  }

  async function handleCreateProduct(e: FormEvent) {
    e.preventDefault();
    setSavingNew(true);
    await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct),
    });
    setSavingNew(false);
    setNewProduct(emptyNewProduct);
    refreshProducts();
  }

  return (
    <main className="grid gap-4">
      {/* 📦 Inventario de productos primero */}
      <section className="card">
        <h2 className="text-xl font-semibold mb-3">
          Inventario de productos & alertas
        </h2>

        {loadingProducts && <p className="text-sm text-zinc-400">Cargando…</p>}

        {!loadingProducts && (!products || products.length === 0) && (
          <p className="text-sm text-zinc-400">
            Aún no tienes productos registrados. Empieza agregando alguno abajo
            (pollos, costillares, leña, envases, etc.).
          </p>
        )}

        {products && products.length > 0 && (
          <div className="overflow-x-auto border border-zinc-800 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-black/40">
                <tr>
                  <th className="px-3 py-2 text-left">Código</th>
                  <th className="px-3 py-2 text-left">Producto</th>
                  <th className="px-3 py-2 text-left">Categoría</th>
                  <th className="px-3 py-2 text-right">Stock</th>
                  <th className="px-3 py-2 text-right">Mínimo</th>
                  <th className="px-3 py-2 text-right">Paso</th>
                  <th className="px-3 py-2 text-left">Proveedor</th>
                  <th className="px-3 py-2 text-left">Contacto</th>
                  <th className="px-3 py-2 text-left">Notas</th>
                  <th className="px-3 py-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((item) => {
                  const low = item.currentQty <= item.minQty;
                  return (
                    <tr
                      key={item._id}
                      className={low ? 'bg-red-500/10' : 'bg-black/10'}
                    >
                      <td className="px-3 py-2 text-xs font-mono">
                        {item.code}
                      </td>
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
                      <td className="px-3 py-2 text-right">
                        {item.step} {item.unit}
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
                            onClick={() => adjustStock(item._id, 'dec')}
                            className="px-2 py-1 rounded-lg bg-black/60 text-xs"
                          >
                            -{item.step}
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustStock(item._id, 'inc')}
                            className="px-2 py-1 rounded-lg bg-black/60 text-xs"
                          >
                            +{item.step}
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

        {/* 📝 Formulario para agregar nuevo producto (con labels) */}
        <div className="mt-6 border-t border-zinc-800 pt-4">
          <h3 className="font-semibold mb-2 text-lg">Nuevo producto</h3>
          <p className="text-xs text-zinc-400 mb-3">
            Registra productos como pollos crudos, costillares, leña, envases,
            tortillas, jugos, etc. Puedes definir si el stock se maneja por kg,
            pieza, litro, gramos, etc. y de cuánto en cuánto se descuenta.
          </p>

          <form
            onSubmit={handleCreateProduct}
            className="grid md:grid-cols-4 gap-3 text-sm"
          >
            {/* Código */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-300">
                Código interno *
              </label>
              <input
                className="input bg-black/40"
                placeholder="Ej. pollo_crudo"
                value={newProduct.code}
                onChange={(e) =>
                  setNewProduct((v) => ({ ...v, code: e.target.value }))
                }
                required
              />
            </div>

            {/* Nombre */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-300">
                Nombre del producto *
              </label>
              <input
                className="input bg-black/40"
                placeholder="Ej. Pollo crudo entero"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct((v) => ({ ...v, name: e.target.value }))
                }
                required
              />
            </div>

            {/* Categoría */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-300">
                Categoría *
              </label>
              <select
                className="input bg-black/40"
                value={newProduct.category}
                onChange={(e) =>
                  setNewProduct((v) => ({
                    ...v,
                    category: e.target.value as Product['category'],
                  }))
                }
              >
                <option value="pollo">Pollos</option>
                <option value="costillar">Costillar</option>
                <option value="aderezo">Aderezos</option>
                <option value="envase">Envases</option>
                <option value="combustible">Leña / gas</option>
                <option value="ingrediente">Ingredientes</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            {/* Unidad */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-300">
                Unidad de medida *
              </label>
              <input
                className="input bg-black/40"
                placeholder="kg, pieza, l, g, paquete…"
                value={newProduct.unit}
                onChange={(e) =>
                  setNewProduct((v) => ({ ...v, unit: e.target.value }))
                }
                required
              />
            </div>

            {/* Stock actual */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-300">
                Stock actual *
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                className="input bg-black/40"
                placeholder="Ej. 2.5"
                value={newProduct.currentQty}
                onChange={(e) =>
                  setNewProduct((v) => ({
                    ...v,
                    currentQty: Number(e.target.value),
                  }))
                }
                required
              />
            </div>

            {/* Stock mínimo */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-300">
                Stock mínimo para alerta *
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                className="input bg-black/40"
                placeholder="Ej. 1.0"
                value={newProduct.minQty}
                onChange={(e) =>
                  setNewProduct((v) => ({
                    ...v,
                    minQty: Number(e.target.value),
                  }))
                }
                required
              />
            </div>

            {/* Paso */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-300">
                Paso de movimiento *
              </label>
              <input
                type="number"
                min={0.001}
                step={0.001}
                className="input bg-black/40"
                placeholder="Ej. 0.25, 0.5, 1, 2.5"
                value={newProduct.step}
                onChange={(e) =>
                  setNewProduct((v) => ({
                    ...v,
                    step: Number(e.target.value),
                  }))
                }
                required
              />
              <p className="text-[10px] text-zinc-500">
                De cuánto en cuánto se descuenta o se suma al stock.
              </p>
            </div>

            {/* Stock objetivo */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-300">
                Stock objetivo (opcional)
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                className="input bg-black/40"
                placeholder="Ej. 10"
                value={newProduct.maxQty ?? ''}
                onChange={(e) =>
                  setNewProduct((v) => ({
                    ...v,
                    maxQty:
                      e.target.value === '' ? null : Number(e.target.value),
                  }))
                }
              />
            </div>

            {/* Proveedor nombre */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-300">
                Proveedor (nombre)
              </label>
              <input
                className="input bg-black/40"
                placeholder="Ej. Abarrotes Don Pepe"
                value={newProduct.supplierName ?? ''}
                onChange={(e) =>
                  setNewProduct((v) => ({
                    ...v,
                    supplierName: e.target.value,
                  }))
                }
              />
            </div>

            {/* Proveedor teléfono */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-300">
                Teléfono proveedor
              </label>
              <input
                className="input bg-black/40"
                placeholder="Ej. 5551234567"
                value={newProduct.supplierPhone ?? ''}
                onChange={(e) =>
                  setNewProduct((v) => ({
                    ...v,
                    supplierPhone: e.target.value,
                  }))
                }
              />
            </div>

            {/* Notas */}
            <div className="space-y-1 md:col-span-4">
              <label className="block text-xs font-medium text-zinc-300">
                Notas de compra
              </label>
              <textarea
                className="input bg-black/40 w-full"
                placeholder="Ej. Se compra en X tienda, precio por kg, ofertas, etc."
                value={newProduct.supplierNotes ?? ''}
                onChange={(e) =>
                  setNewProduct((v) => ({
                    ...v,
                    supplierNotes: e.target.value,
                  }))
                }
                rows={2}
              />
            </div>

            <div className="md:col-span-4 mt-1">
              <button
                type="submit"
                disabled={savingNew}
                className="w-full px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-sm"
              >
                {savingNew ? 'Guardando…' : 'Agregar producto'}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* 🧾 Pedidos recientes (ahora abajo) */}
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
    </main>
  );
}

export default function Admin() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminInner />
    </ProtectedRoute>
  );
}
