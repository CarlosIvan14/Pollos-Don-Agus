// app/admin/components/MenuManagement.tsx
'use client';

import { useState, FormEvent } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type MenuProduct = {
  _id: string;
  code: string;
  name: string;
  description?: string;
  price: number;
  isActive: boolean;
  availableFlavors: Array<{ _id: string; name: string; price: number }>;
  availableStyles: Array<{ _id: string; name: string; displayName: string }>;
  showOnlyInStore?: boolean;
  sortOrder?: number;
};

type Flavor = {
  _id: string;
  name: string;
  price: number;
  isActive: boolean;
  sortOrder?: number;
};

type Style = {
  _id: string;
  name: string;
  displayName: string;
  isActive: boolean;
  sortOrder?: number;
};

export default function MenuManagement() {
  const { data: menuData, mutate: refreshMenu } = useSWR<{
    products: MenuProduct[];
    flavors: Flavor[];
    styles: Style[];
  }>('/api/menu/active', fetcher);

  const { data: allFlavors, mutate: refreshFlavors } = useSWR<Flavor[]>(
    '/api/menu/flavors',
    fetcher
  );
  const { data: allStyles, mutate: refreshStyles } = useSWR<Style[]>(
    '/api/menu/styles',
    fetcher
  );

  const [activeTab, setActiveTab] = useState<'products' | 'flavors' | 'styles'>('products');
  const [editingProduct, setEditingProduct] = useState<MenuProduct | null>(null);
  const [editingFlavor, setEditingFlavor] = useState<Flavor | null>(null);
  const [editingStyle, setEditingStyle] = useState<Style | null>(null);

  // Estados para formularios nuevos
  const [newProduct, setNewProduct] = useState({
    code: '',
    name: '',
    description: '',
    price: 0,
    availableFlavors: [] as string[],
    availableStyles: [] as string[],
    showOnlyInStore: false,
    sortOrder: 0,
  });

  const [newFlavor, setNewFlavor] = useState({
    name: '',
    price: 0,
    sortOrder: 0,
  });

  const [newStyle, setNewStyle] = useState({
    name: '',
    displayName: '',
    sortOrder: 0,
  });

  async function saveProduct(e: FormEvent) {
    e.preventDefault();
    const url = editingProduct
      ? `/api/menu/products/${editingProduct._id}`
      : '/api/menu/products';
    const method = editingProduct ? 'PATCH' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newProduct,
        price: Number(newProduct.price),
        sortOrder: Number(newProduct.sortOrder),
      }),
    });

    setEditingProduct(null);
    setNewProduct({
      code: '',
      name: '',
      description: '',
      price: 0,
      availableFlavors: [],
      availableStyles: [],
      showOnlyInStore: false,
      sortOrder: 0,
    });
    refreshMenu();
  }

  async function saveFlavor(e: FormEvent) {
    e.preventDefault();
    const url = editingFlavor
      ? `/api/menu/flavors/${editingFlavor._id}`
      : '/api/menu/flavors';
    const method = editingFlavor ? 'PATCH' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newFlavor,
        price: Number(newFlavor.price),
        sortOrder: Number(newFlavor.sortOrder),
      }),
    });

    setEditingFlavor(null);
    setNewFlavor({ name: '', price: 0, sortOrder: 0 });
    refreshFlavors();
    refreshMenu();
  }

  async function saveStyle(e: FormEvent) {
    e.preventDefault();
    const url = editingStyle
      ? `/api/menu/styles/${editingStyle._id}`
      : '/api/menu/styles';
    const method = editingStyle ? 'PATCH' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newStyle,
        sortOrder: Number(newStyle.sortOrder),
      }),
    });

    setEditingStyle(null);
    setNewStyle({ name: '', displayName: '', sortOrder: 0 });
    refreshStyles();
    refreshMenu();
  }

  async function toggleProductActive(id: string, current: boolean) {
    await fetch(`/api/menu/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !current }),
    });
    refreshMenu();
  }

  async function toggleFlavorActive(id: string, current: boolean) {
    await fetch(`/api/menu/flavors/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !current }),
    });
    refreshFlavors();
    refreshMenu();
  }

  async function toggleStyleActive(id: string, current: boolean) {
    await fetch(`/api/menu/styles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !current }),
    });
    refreshStyles();
    refreshMenu();
  }

  function startEditProduct(product: MenuProduct) {
    setEditingProduct(product);
    setNewProduct({
      code: product.code,
      name: product.name,
      description: product.description || '',
      price: product.price,
      availableFlavors: product.availableFlavors.map((f) => f._id),
      availableStyles: product.availableStyles.map((s) => s._id),
      showOnlyInStore: product.showOnlyInStore || false,
      sortOrder: product.sortOrder || 0,
    });
  }

  function startEditFlavor(flavor: Flavor) {
    setEditingFlavor(flavor);
    setNewFlavor({
      name: flavor.name,
      price: flavor.price,
      sortOrder: flavor.sortOrder || 0,
    });
  }

  function startEditStyle(style: Style) {
    setEditingStyle(style);
    setNewStyle({
      name: style.name,
      displayName: style.displayName,
      sortOrder: style.sortOrder || 0,
    });
  }

  const products = menuData?.products || [];
  const flavors = allFlavors || [];
  const styles = allStyles || [];

  return (
    <section className="card">
      <h2 className="text-xl font-semibold mb-4">Gestión del Menú</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-zinc-800">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === 'products'
              ? 'border-b-2 border-emerald-500 text-emerald-400'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Productos
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('flavors')}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === 'flavors'
              ? 'border-b-2 border-emerald-500 text-emerald-400'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Sabores
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('styles')}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === 'styles'
              ? 'border-b-2 border-emerald-500 text-emerald-400'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Estilos
        </button>
      </div>

      {/* Tab: Productos */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <form onSubmit={saveProduct} className="grid md:grid-cols-3 gap-3 p-4 bg-black/20 rounded-lg">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Código *
              </label>
              <input
                className="input bg-black/40 text-sm"
                value={newProduct.code}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, code: e.target.value.toLowerCase() })
                }
                placeholder="pollo, medio_pollo, etc."
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Nombre *
              </label>
              <input
                className="input bg-black/40 text-sm"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
                placeholder="Pollo completo"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Precio *
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                className="input bg-black/40 text-sm"
                value={newProduct.price}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, price: Number(e.target.value) })
                }
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Descripción
              </label>
              <input
                className="input bg-black/40 text-sm w-full"
                value={newProduct.description}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, description: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Orden
              </label>
              <input
                type="number"
                className="input bg-black/40 text-sm"
                value={newProduct.sortOrder}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, sortOrder: Number(e.target.value) })
                }
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newProduct.showOnlyInStore}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, showOnlyInStore: e.target.checked })
                  }
                  className="rounded"
                />
                Solo en tienda
              </label>
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Sabores disponibles
              </label>
              <div className="flex flex-wrap gap-2">
                {flavors.map((f) => (
                  <label key={f._id} className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={newProduct.availableFlavors.includes(f._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewProduct({
                            ...newProduct,
                            availableFlavors: [...newProduct.availableFlavors, f._id],
                          });
                        } else {
                          setNewProduct({
                            ...newProduct,
                            availableFlavors: newProduct.availableFlavors.filter(
                              (id) => id !== f._id
                            ),
                          });
                        }
                      }}
                      className="rounded"
                    />
                    {f.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Estilos disponibles (solo para pollos)
              </label>
              <div className="flex flex-wrap gap-2">
                {styles.map((s) => (
                  <label key={s._id} className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={newProduct.availableStyles.includes(s._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewProduct({
                            ...newProduct,
                            availableStyles: [...newProduct.availableStyles, s._id],
                          });
                        } else {
                          setNewProduct({
                            ...newProduct,
                            availableStyles: newProduct.availableStyles.filter(
                              (id) => id !== s._id
                            ),
                          });
                        }
                      }}
                      className="rounded"
                    />
                    {s.displayName}
                  </label>
                ))}
              </div>
            </div>
            <div className="md:col-span-3 flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium"
              >
                {editingProduct ? 'Actualizar' : 'Crear'} Producto
              </button>
              {editingProduct && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setNewProduct({
                      code: '',
                      name: '',
                      description: '',
                      price: 0,
                      availableFlavors: [],
                      availableStyles: [],
                      showOnlyInStore: false,
                      sortOrder: 0,
                    });
                  }}
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          <div className="overflow-x-auto border border-zinc-800 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-black/40">
                <tr>
                  <th className="px-3 py-2 text-left">Código</th>
                  <th className="px-3 py-2 text-left">Nombre</th>
                  <th className="px-3 py-2 text-right">Precio</th>
                  <th className="px-3 py-2 text-left">Sabores</th>
                  <th className="px-3 py-2 text-left">Estilos</th>
                  <th className="px-3 py-2 text-center">Estado</th>
                  <th className="px-3 py-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id} className="bg-black/10">
                    <td className="px-3 py-2 font-mono text-xs">{p.code}</td>
                    <td className="px-3 py-2">{p.name}</td>
                    <td className="px-3 py-2 text-right font-semibold">${p.price}</td>
                    <td className="px-3 py-2 text-xs">
                      {p.availableFlavors.length > 0
                        ? p.availableFlavors.map((f) => f.name).join(', ')
                        : '—'}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {p.availableStyles.length > 0
                        ? p.availableStyles.map((s) => s.displayName).join(', ')
                        : '—'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => toggleProductActive(p._id, p.isActive)}
                        className={`px-2 py-1 rounded text-xs ${
                          p.isActive
                            ? 'bg-emerald-600/30 text-emerald-300'
                            : 'bg-zinc-700 text-zinc-400'
                        }`}
                      >
                        {p.isActive ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => startEditProduct(p)}
                        className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Sabores */}
      {activeTab === 'flavors' && (
        <div className="space-y-4">
          <form onSubmit={saveFlavor} className="grid md:grid-cols-4 gap-3 p-4 bg-black/20 rounded-lg">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Nombre *
              </label>
              <input
                className="input bg-black/40 text-sm"
                value={newFlavor.name}
                onChange={(e) =>
                  setNewFlavor({ ...newFlavor, name: e.target.value })
                }
                placeholder="BBQ, Chipotle, etc."
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Precio adicional *
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                className="input bg-black/40 text-sm"
                value={newFlavor.price}
                onChange={(e) =>
                  setNewFlavor({ ...newFlavor, price: Number(e.target.value) })
                }
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Orden
              </label>
              <input
                type="number"
                className="input bg-black/40 text-sm"
                value={newFlavor.sortOrder}
                onChange={(e) =>
                  setNewFlavor({ ...newFlavor, sortOrder: Number(e.target.value) })
                }
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium"
              >
                {editingFlavor ? 'Actualizar' : 'Crear'} Sabor
              </button>
            </div>
            {editingFlavor && (
              <div className="md:col-span-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingFlavor(null);
                    setNewFlavor({ name: '', price: 0, sortOrder: 0 });
                  }}
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm"
                >
                  Cancelar
                </button>
              </div>
            )}
          </form>

          <div className="overflow-x-auto border border-zinc-800 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-black/40">
                <tr>
                  <th className="px-3 py-2 text-left">Nombre</th>
                  <th className="px-3 py-2 text-right">Precio adicional</th>
                  <th className="px-3 py-2 text-center">Estado</th>
                  <th className="px-3 py-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {flavors.map((f) => (
                  <tr key={f._id} className="bg-black/10">
                    <td className="px-3 py-2">{f.name}</td>
                    <td className="px-3 py-2 text-right font-semibold">
                      ${f.price}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => toggleFlavorActive(f._id, f.isActive)}
                        className={`px-2 py-1 rounded text-xs ${
                          f.isActive
                            ? 'bg-emerald-600/30 text-emerald-300'
                            : 'bg-zinc-700 text-zinc-400'
                        }`}
                      >
                        {f.isActive ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => startEditFlavor(f)}
                        className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Estilos */}
      {activeTab === 'styles' && (
        <div className="space-y-4">
          <form onSubmit={saveStyle} className="grid md:grid-cols-4 gap-3 p-4 bg-black/20 rounded-lg">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Código *
              </label>
              <input
                className="input bg-black/40 text-sm"
                value={newStyle.name}
                onChange={(e) =>
                  setNewStyle({ ...newStyle, name: e.target.value.toLowerCase() })
                }
                placeholder="asado, rostizado"
                required
                disabled={!!editingStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Nombre a mostrar *
              </label>
              <input
                className="input bg-black/40 text-sm"
                value={newStyle.displayName}
                onChange={(e) =>
                  setNewStyle({ ...newStyle, displayName: e.target.value })
                }
                placeholder="Asado, Rostizado"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Orden
              </label>
              <input
                type="number"
                className="input bg-black/40 text-sm"
                value={newStyle.sortOrder}
                onChange={(e) =>
                  setNewStyle({ ...newStyle, sortOrder: Number(e.target.value) })
                }
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium"
              >
                {editingStyle ? 'Actualizar' : 'Crear'} Estilo
              </button>
            </div>
            {editingStyle && (
              <div className="md:col-span-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingStyle(null);
                    setNewStyle({ name: '', displayName: '', sortOrder: 0 });
                  }}
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm"
                >
                  Cancelar
                </button>
              </div>
            )}
          </form>

          <div className="overflow-x-auto border border-zinc-800 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-black/40">
                <tr>
                  <th className="px-3 py-2 text-left">Código</th>
                  <th className="px-3 py-2 text-left">Nombre</th>
                  <th className="px-3 py-2 text-center">Estado</th>
                  <th className="px-3 py-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {styles.map((s) => (
                  <tr key={s._id} className="bg-black/10">
                    <td className="px-3 py-2 font-mono text-xs">{s.name}</td>
                    <td className="px-3 py-2">{s.displayName}</td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => toggleStyleActive(s._id, s.isActive)}
                        className={`px-2 py-1 rounded text-xs ${
                          s.isActive
                            ? 'bg-emerald-600/30 text-emerald-300'
                            : 'bg-zinc-700 text-zinc-400'
                        }`}
                      >
                        {s.isActive ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => startEditStyle(s)}
                        className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

