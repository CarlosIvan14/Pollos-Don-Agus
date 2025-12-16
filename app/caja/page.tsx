// app/caja/page.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Quantity from '@/components/Quantity';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

type ItemKind =
  | 'pollo'
  | 'medio_pollo'
  | 'costillar_medio'
  | 'costillar_normal'
  | 'costillar_grande';

// mismos valores que en el esquema de Mongoose:
// enum: ['pendiente','confirmado','en_ruta','entregado','cancelado']
type OrderStatus = 'pendiente' | 'confirmado' | 'en_ruta' | 'entregado';

type Order = {
  _id: string;
  createdAt: string;
  source: 'cliente' | 'caja';
  delivery: boolean;
  items: { kind: ItemKind; qty: number }[];
  tortillasPacks: number;
  total: number;
  status?: OrderStatus;
  customer?: {
    name?: string;
    phone?: string;
    addressNote?: string;
    desiredAt?: string;
  };
};

const LABELS: Record<ItemKind, string> = {
  pollo: 'Pollo completo',
  medio_pollo: '1/2 Pollo',
  costillar_medio: '1/2 Costillar',
  costillar_normal: 'Costillar',
  costillar_grande: 'Costillar Grande',
};

const BASE: Record<ItemKind, number> = {
  pollo: 200,
  medio_pollo: 100,
  costillar_medio: 100,
  costillar_normal: 200,
  costillar_grande: 250,
};

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'pendiente', label: 'En espera' },
  { value: 'confirmado', label: 'En preparación' },
  { value: 'en_ruta', label: 'Enviado' },
  { value: 'entregado', label: 'Finalizado' },
];

type InventorySnapshot = {
  pollo: number;
  costillar_normal: number;
  costillar_grande: number;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDesiredTime(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/* --- helpers para slots de horas (igual que en orden del cliente) --- */

function roundToNext30(date = new Date()) {
  const d = new Date(date);
  const add = (30 - (d.getMinutes() % 30)) % 30;
  d.setMinutes(d.getMinutes() + add, 0, 0);
  return d;
}

function todayAt(hour: number, minute = 0) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

function buildTimeSlots(hoursAhead = 8, locale = 'es-MX') {
  const opening = todayAt(12, 0);
  const closing = todayAt(18, 0);
  const now = new Date();

  if (now >= closing) return [];

  const start = now <= opening ? opening : roundToNext30(now);
  const end = closing;

  const fmt = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const list: { value: string; label: string }[] = [];
  for (let t = +start; t <= +end; t += 30 * 60 * 1000) {
    const d = new Date(t);
    list.push({ value: d.toISOString(), label: fmt.format(d) });
  }
  return list;
}

/* --- notificaciones SSE --- */

function useNotifier(onNew?: () => void) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  useEffect(() => {
    const es = new EventSource('/api/orders/stream');
    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data || '{}');
        if (msg?.type === 'nueva_orden') {
          // beep + vibración
          try {
            audioCtxRef.current =
              audioCtxRef.current ||
              new (window.AudioContext ||
                (window as any).webkitAudioContext)();
            const ctx = audioCtxRef.current;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 880;
            gain.gain.value = 0.22;
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            setTimeout(() => osc.stop(), 600);
          } catch {}
          if (navigator.vibrate) navigator.vibrate([120, 80, 120]);
          onNew?.();
        }
      } catch {}
    };
    return () => es.close();
  }, [onNew]);
}

// Toggle tipo iOS
function DeliverySwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-emerald-500' : 'bg-zinc-600'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function normalizeMxPhone(raw: string) {
  const digits = raw.replace(/\D+/g, '');
  return digits.replace(/^(?:52|0052)/, '');
}
function isValidMxPhone(raw: string) {
  const d = normalizeMxPhone(raw);
  return d.length === 10;
}

// --- Helpers de consumo de inventario (caja) ---

function getChickenUnitsFromRecord(
  rec: Record<ItemKind, number>
): number {
  return (rec.pollo || 0) * 1 + (rec.medio_pollo || 0) * 0.5;
}

function getRibNormalUnitsFromRecord(
  rec: Record<ItemKind, number>
): number {
  return (rec.costillar_normal || 0) * 1 + (rec.costillar_medio || 0) * 0.5;
}

function getRibGrandeUnitsFromRecord(
  rec: Record<ItemKind, number>
): number {
  return (rec.costillar_grande || 0) * 1;
}

function validateRecordForKind(
  rec: Record<ItemKind, number>,
  inv: InventorySnapshot,
  changedKind: ItemKind
): string | null {
  if (changedKind === 'pollo' || changedKind === 'medio_pollo') {
    const used = getChickenUnitsFromRecord(rec);
    if (used > inv.pollo) {
      return `El máximo disponible de pollo hoy es ${inv.pollo} pollo(s) crudo(s). Ajusta la cantidad.`;
    }
  }

  if (changedKind === 'costillar_medio' || changedKind === 'costillar_normal') {
    const used = getRibNormalUnitsFromRecord(rec);
    if (used > inv.costillar_normal) {
      return `El máximo disponible de costillar normal hoy es ${inv.costillar_normal} pieza(s). Ajusta la cantidad.`;
    }
  }

  if (changedKind === 'costillar_grande') {
    const used = getRibGrandeUnitsFromRecord(rec);
    if (used > inv.costillar_grande) {
      return `El máximo disponible de costillar grande hoy es ${inv.costillar_grande} pieza(s). Ajusta la cantidad.`;
    }
  }

  return null;
}

function validateRecordGlobal(
  rec: Record<ItemKind, number>,
  inv: InventorySnapshot
): string | null {
  const polloU = getChickenUnitsFromRecord(rec);
  if (polloU > inv.pollo) {
    return `El máximo disponible de pollo hoy es ${inv.pollo} pollo(s) crudo(s). Ajusta la cantidad.`;
  }

  const ribN = getRibNormalUnitsFromRecord(rec);
  if (ribN > inv.costillar_normal) {
    return `El máximo disponible de costillar normal hoy es ${inv.costillar_normal} pieza(s). Ajusta la cantidad.`;
  }

  const ribG = getRibGrandeUnitsFromRecord(rec);
  if (ribG > inv.costillar_grande) {
    return `El máximo disponible de costillar grande hoy es ${inv.costillar_grande} pieza(s). Ajusta la cantidad.`;
  }

  return null;
}

export default function Caja() {
  const [delivery, setDelivery] = useState(false);
  const [tortillas, setTortillas] = useState(0);
  const [items, setItems] = useState<Record<ItemKind, number>>({
    pollo: 0,
    medio_pollo: 0,
    costillar_medio: 0,
    costillar_normal: 0,
    costillar_grande: 0,
  });

  // datos de cliente SOLO cuando es a domicilio
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerDesiredAt, setCustomerDesiredAt] = useState('');

  const [slots, setSlots] = useState<{ value: string; label: string }[]>([]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStatusId, setSavingStatusId] = useState<string | null>(null);

  const [inventory, setInventory] = useState<InventorySnapshot | null>(null);
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  useEffect(() => {
    setSlots(buildTimeSlots(8, 'es-MX'));

    (async () => {
      try {
        const res = await fetch('/api/inventory/availability', {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('Error al cargar inventario');
        const data = (await res.json()) as InventorySnapshot;
        setInventory(data);
      } catch (e) {
        console.error(e);
        setInventoryError(
          'No se pudo leer el inventario actual. El stock mostrado puede no estar actualizado.'
        );
      }
    })();
  }, []);

  async function load() {
    setLoading(true);
    const r = await fetch('/api/orders', { cache: 'no-store' });
    const j = await r.json();
    setOrders(j || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);
  useNotifier(load);

  const pedidosCerrados = slots.length === 0;

  // Solo pedidos de HOY
  const todayOrders = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();

    return [...orders]
      .filter((o) => {
        const dt = new Date(o.createdAt);
        return (
          dt.getFullYear() === y &&
          dt.getMonth() === m &&
          dt.getDate() === d
        );
      })
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime()
      );
  }, [orders]);

  const total = useMemo(() => {
    const perItem = (
      Object.entries(items) as [ItemKind, number][]
    ).reduce((sum, [k, qty]) => sum + BASE[k] * (qty || 0), 0);
    const surcharge = delivery ? 20 : 0;
    return perItem + surcharge + tortillas * 10;
  }, [items, delivery, tortillas]);

  async function registrarVenta() {
    if (pedidosCerrados) {
      alert('El registro de pedidos solo está disponible de 12:00 pm a 6:00 pm.');
      return;
    }

    const orderItems = (
      Object.entries(items) as [ItemKind, number][]
    ).flatMap(([k, qty]) => (qty ? [{ kind: k, qty }] : []));
    if (!orderItems.length) {
      alert('Agrega al menos 1 artículo');
      return;
    }

    // Chequeo final de stock contra inventario
    if (inventory) {
      const invErr = validateRecordGlobal(items, inventory);
      if (invErr) {
        alert(invErr);
        return;
      }
    }

    // Si es a domicilio, validar datos básicos del cliente
    if (delivery) {
      const errs: string[] = [];
      if (!customerName.trim()) errs.push('Nombre del cliente');
      if (!customerPhone.trim()) errs.push('Teléfono de contacto');
      else if (!isValidMxPhone(customerPhone))
        errs.push('Teléfono con 10 dígitos (MX)');
      if (!customerAddress.trim()) errs.push('Dirección del cliente');
      if (!customerDesiredAt.trim()) errs.push('Hora de entrega');

      if (errs.length > 0) {
        alert(
          `Faltan datos para el envío a domicilio:\n- ${errs.join(
            '\n- '
          )}`
        );
        return;
      }
    }

    const body: any = {
      source: 'caja',
      items: orderItems,
      delivery,
      tortillasPacks: tortillas,
    };

    if (delivery) {
      body.customer = {
        name: customerName.trim(),
        phone: normalizeMxPhone(customerPhone),
        addressNote: customerAddress.trim(),
        desiredAt: customerDesiredAt.trim(),
      };
    }

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      alert('Venta registrada ✅');
      setItems({
        pollo: 0,
        medio_pollo: 0,
        costillar_medio: 0,
        costillar_normal: 0,
        costillar_grande: 0,
      });
      setTortillas(0);
      setDelivery(false);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setCustomerDesiredAt('');
      load();
    } else {
      const j = await res.json().catch(() => null);
      alert(j?.error || 'Error');
    }
  }

  async function updateStatus(id: string, status: OrderStatus) {
    setSavingStatusId(id);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        alert(j?.error || 'No se pudo actualizar el estado');
        return;
      }
      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, status } : o))
      );
    } finally {
      setSavingStatusId(null);
    }
  }

  const noPollo = inventory && inventory.pollo <= 0;
  const noCostillarNormal = inventory && inventory.costillar_normal <= 0;
  const noCostillarGrande = inventory && inventory.costillar_grande <= 0;

  return (
    <ProtectedRoute allowedRoles={['caja', 'admin']}>
      <main className="grid gap-4">
        {/* Registro rápido */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {(Object.keys(LABELS) as ItemKind[]).map((k) => {
            const hide =
              inventory &&
              (((k === 'pollo' || k === 'medio_pollo') && noPollo) ||
                ((k === 'costillar_medio' || k === 'costillar_normal') &&
                  noCostillarNormal) ||
                (k === 'costillar_grande' && noCostillarGrande));

            if (hide) return null;

            return (
              <div key={k} className="card flex flex-col gap-2 items-center">
                <div className="text-center font-semibold">
                  {LABELS[k]}
                </div>
                <div className="text-sm text-zinc-400">${BASE[k]}</div>
                <Quantity
                  value={items[k]}
                  onChange={(n) =>
                    setItems((prev) => {
                      const safeN = Math.max(0, n);
                      if (!inventory) {
                        return {
                          ...prev,
                          [k]: safeN,
                        };
                      }

                      const next = {
                        ...prev,
                        [k]: safeN,
                      };

                      const err = validateRecordForKind(
                        next,
                        inventory,
                        k
                      );
                      if (err) {
                        alert(err);
                        return prev;
                      }

                      return next;
                    })
                  }
                />
              </div>
            );
          })}
        </div>

        {inventoryError && (
          <p className="text-[11px] text-amber-300">
            {inventoryError}
          </p>
        )}

        {/* Controles principales */}
        <div className="grid md:grid-cols-3 gap-3">
          {/* Envío a domicilio con toggle + info */}
          <div className="card flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Envío a domicilio</div>
                <div className="text-sm text-zinc-400">
                  + $20 por pedido.
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span>{delivery ? 'Sí' : 'No'}</span>
                <DeliverySwitch checked={delivery} onChange={setDelivery} />
              </div>
            </div>
            <p className="text-xs text-zinc-500">
              Si se activa, se registran los datos del cliente para entrega
              a domicilio.
            </p>
            {pedidosCerrados && (
              <p className="text-[11px] text-red-300">
                Horario de ventas en caja para este módulo: 12:00–18:00.
              </p>
            )}
          </div>

          {/* Tortillas */}
          <div className="card flex items-center justify-between">
            <div>
              <div className="font-semibold">Tortillas</div>
              <div className="text-sm text-zinc-400">$10 por paquete</div>
            </div>
            <Quantity value={tortillas} onChange={setTortillas} />
          </div>

          {/* Total */}
          <div className="card flex items-center justify-between">
            <div className="text-xl font-bold">Total</div>
            <div className="text-3xl font-extrabold">${total}</div>
          </div>
        </div>

        {/* Formulario de datos de envío (solo si es a domicilio) */}
        {delivery && (
          <section className="card max-w-3xl mx-auto space-y-4">
            <header className="space-y-1">
              <h2 className="text-lg font-semibold">
                Datos de envío a domicilio
              </h2>
              <p className="text-xs text-zinc-400">
                Estos datos se usan para coordinar la entrega con el repartidor.
              </p>
            </header>

            {/* Fila 1: nombre / teléfono / hora */}
            <div className="grid md:grid-cols-3 gap-4 items-end">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-zinc-200 text-center md:text-left">
                  Nombre del cliente *
                </label>
                <input
                  className="input h-9 text-sm"
                  placeholder="Ej. Juan Pérez"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-zinc-200 text-center md:text-left">
                  Teléfono de contacto *
                </label>
                <input
                  className="input h-9 text-sm"
                  placeholder="10 dígitos (MX)"
                  inputMode="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-zinc-200 text-center md:text-left">
                  Hora de entrega *
                </label>
                <select
                  className="input h-9 text-sm"
                  value={customerDesiredAt}
                  onChange={(e) => setCustomerDesiredAt(e.target.value)}
                >
                  <option value="">
                    {pedidosCerrados
                      ? 'Horario cerrado (12:00–18:00)'
                      : 'Selecciona una hora'}
                  </option>
                  {slots.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dirección: ocupa todo el ancho */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-zinc-200 text-center md:text-left">
                Dirección / referencias *
              </label>
              <textarea
                className="input text-sm min-h-[80px] w-full"
                placeholder="Calle, número, colonia, referencias..."
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
              />
            </div>
          </section>
        )}

        <button
          className="btn text-xl h-14 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={registrarVenta}
          disabled={pedidosCerrados}
        >
          {pedidosCerrados
            ? 'Horario cerrado (12:00–18:00)'
            : 'Registrar venta'}
        </button>

        {/* Lista de pedidos */}
        <section className="card">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold">Pedidos recientes (hoy)</h2>
            {!loading && (
              <span className="text-xs text-zinc-500">
                {todayOrders.length} pedido(s) del día
              </span>
            )}
          </div>

          {loading ? (
            <div className="text-sm text-zinc-400">Cargando…</div>
          ) : todayOrders.length === 0 ? (
            <div className="text-sm text-zinc-400">
              No hay pedidos registrados hoy.
            </div>
          ) : (
            <div className="grid gap-2 text-sm">
              {/* Encabezados de columnas */}
              <div className="hidden md:grid md:grid-cols-9 px-3 pb-1 text-xs text-zinc-500">
                <div>Hora</div>
                <div>Origen</div>
                <div>Cliente</div>
                <div>Canal</div>
                <div>Detalle</div>
                <div>Total</div>
                <div>Teléfono</div>
                <div>Hora deseada</div>
                <div>Estado</div>
              </div>

              {todayOrders.map((o) => (
                <div
                  key={o._id}
                  className="grid gap-2 md:grid-cols-9 items-center bg-black/20 rounded-xl p-3"
                >
                  <div className="font-semibold">
                    {formatTime(o.createdAt)}
                  </div>

                  <div className="capitalize text-xs md:text-sm">
                    {o.source}
                  </div>

                  <div className="truncate">
                    {o.customer?.name || '—'}
                  </div>

                  <div className="truncate text-xs md:text-sm">
                    {o.delivery
                      ? o.customer?.addressNote || 'Domicilio'
                      : 'Local'}
                  </div>

                  <div className="text-xs md:text-sm">
                    {o.items
                      .map((it) => `${it.qty}x ${LABELS[it.kind]}`)
                      .join(', ')}
                    {o.tortillasPacks
                      ? ` + ${o.tortillasPacks} tortillas`
                      : ''}
                  </div>

                  <div className="font-bold">${o.total}</div>

                  <div className="text-xs md:text-sm">
                    {o.customer?.phone || '—'}
                  </div>

                  <div className="text-xs md:text-sm font-medium text-amber-300">
                    {formatDesiredTime(o.customer?.desiredAt)}
                  </div>

                  {/* Estado editable */}
                  <div className="flex flex-col gap-1 text-xs md:text-sm">
                    <select
                      className="input h-8 text-xs"
                      value={o.status ?? 'pendiente'}
                      onChange={(e) =>
                        updateStatus(
                          o._id,
                          e.target.value as OrderStatus
                        )
                      }
                      disabled={savingStatusId === o._id}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-zinc-500">
                      {savingStatusId === o._id
                        ? 'Guardando…'
                        : STATUS_OPTIONS.find(
                            (s) => s.value === (o.status ?? 'pendiente')
                          )?.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </ProtectedRoute>
  );
}
