// app/orden/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Trash2 } from 'lucide-react';
import useSWR from 'swr';
import { useInventoryStream } from '@/lib/useInventoryStream';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ItemKind = string;

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
};

type Flavor = {
  _id: string;
  name: string;
  price: number;
  isActive: boolean;
};

type Style = {
  _id: string;
  name: string;
  displayName: string;
  isActive: boolean;
};

type MenuData = {
  products: MenuProduct[];
  flavors: Flavor[];
  styles: Style[];
};

// Texto de la dirección del negocio
const BUSINESS_ADDR =
  'Ignacio Manuel Altamirano 216, Centro, Puruándiro, Michoacán, 58500';

// Google Maps embed del negocio
const BUSINESS_IFRAME_SRC =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4610.7957853698435!2d-101.51680462476878!3d20.084492781338945!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x842c51d0174a292f%3A0xd14050e239a505bd!2sCalle%20Ignacio%20Manuel%20Altamirano%20216%2C%20Centro%2C%2058500%20Puru%C3%A1ndiro%2C%20Mich.!5e1!3m2!1ses-419!2smx!4v1755747891144!5m2!1ses-419!2smx';

// Selector de mapa para ajustar pin — sin SSR
const MapPicker = dynamic(() => import('app/components/MapPicker'), {
  ssr: false,
});

function normalizeMxPhone(raw: string) {
  const digits = raw.replace(/\D+/g, '');
  return digits.replace(/^(?:52|0052)/, '');
}
function isValidMxPhone(raw: string) {
  const d = normalizeMxPhone(raw);
  return d.length === 10;
}

/* Tiempo: siguiente múltiplo de 30 min, pero solo entre 12:00 y 18:00 */
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
  const opening = todayAt(12, 0); // 12:00
  const closing = todayAt(18, 0); // 18:00
  const now = new Date();

  if (now >= closing) return []; // horario cerrado

  const start = now <= opening ? opening : roundToNext30(now);
  const end = closing;

  const fmt = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const list: { value: string; label: string }[] = [];
  for (let t = +start; t <= +end; t += 30 * 60 * 1000) {
    const dd = new Date(t);
    list.push({ value: dd.toISOString(), label: fmt.format(dd) });
  }
  return list;
}

/** Switch tipo iOS para activar/desactivar domicilio */
function DeliverySwitch({
  checked,
  onChange,
  tone = 'ok',
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  tone?: 'ok' | 'error';
}) {
  const activeColor = tone === 'error' ? 'bg-red-500' : 'bg-emerald-500';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? activeColor : 'bg-zinc-600'
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

type DialogTone = 'info' | 'error' | 'success';

type OrderItemState = {
  kind: ItemKind;
  qty: number;
  flavor?: string;
  flavorId?: string;
  chickenStyle?: string;
  styleId?: string;
  productId?: string;
};

/**
 * Snapshot de inventario que te regresa /api/inventory/availability
 * (lo dejamos compatible con lo que ya tienes)
 */
type InventorySnapshot = {
  pollo: number;
  costillar_normal: number;
  costillar_grande: number;
};

/**
 * Mapa de consumo: por cada "kind" vendido, qué llave del inventario consume y en qué factor.
 * - pollo: 1 pollo
 * - medio_pollo: 0.5 pollo
 * - costillar_medio: 0.5 costillar_normal (según tu lógica actual)
 */
const CONSUMPTION: Record<
  string,
  Array<{ inventoryKey: keyof InventorySnapshot | string; factor: number }>
> = {
  pollo: [{ inventoryKey: 'pollo', factor: 1 }],
  medio_pollo: [{ inventoryKey: 'pollo', factor: 0.5 }],

  costillar_normal: [{ inventoryKey: 'costillar_normal', factor: 1 }],
  costillar_medio: [{ inventoryKey: 'costillar_normal', factor: 0.5 }],

  costillar_grande: [{ inventoryKey: 'costillar_grande', factor: 1 }],
};

function getInventoryUsageFromItems(
  items: OrderItemState[]
): Record<string, number> {
  const usage: Record<string, number> = {};
  for (const it of items) {
    const rules = CONSUMPTION[it.kind] ?? [{ inventoryKey: it.kind, factor: 1 }]; // fallback
    for (const r of rules) {
      usage[r.inventoryKey] = (usage[r.inventoryKey] ?? 0) + it.qty * r.factor;
    }
  }
  return usage;
}

function validateInventoryGlobal(
  items: OrderItemState[],
  inv: InventorySnapshot
): string | null {
  const usage = getInventoryUsageFromItems(items);

  for (const key of Object.keys(usage)) {
    const used = usage[key] ?? 0;
    const available = (inv as any)[key] ?? 0;

    if (used > available) {
      // Mensajes bonitos solo para los que ya manejas
      if (key === 'pollo') {
        return `El máximo disponible de pollo hoy es ${inv.pollo} pollo(s) crudo(s). Ajusta la cantidad.`;
      }
      if (key === 'costillar_normal') {
        return `El máximo disponible de costillar normal hoy es ${inv.costillar_normal} pieza(s). Ajusta la cantidad.`;
      }
      if (key === 'costillar_grande') {
        return `El máximo disponible de costillar grande hoy es ${inv.costillar_grande} pieza(s). Ajusta la cantidad.`;
      }

      return `No hay suficiente stock para "${key}". Disponible: ${available}. Ajusta la cantidad.`;
    }
  }

  return null;
}

function validateInventoryForKind(
  items: OrderItemState[],
  inv: InventorySnapshot,
  changedKind: ItemKind
): string | null {
  const rules = CONSUMPTION[changedKind] ?? [{ inventoryKey: changedKind, factor: 1 }];
  const usage = getInventoryUsageFromItems(items);

  for (const r of rules) {
    const key = r.inventoryKey as string;
    const used = usage[key] ?? 0;
    const available = (inv as any)[key] ?? 0;

    if (used > available) {
      if (key === 'pollo') {
        return `El máximo disponible de pollo hoy es ${inv.pollo} pollo(s) crudo(s). Ajusta la cantidad.`;
      }
      if (key === 'costillar_normal') {
        return `El máximo disponible de costillar normal hoy es ${inv.costillar_normal} pieza(s). Ajusta la cantidad.`;
      }
      if (key === 'costillar_grande') {
        return `El máximo disponible de costillar grande hoy es ${inv.costillar_grande} pieza(s). Ajusta la cantidad.`;
      }
      return `No hay suficiente stock para "${key}". Disponible: ${available}. Ajusta la cantidad.`;
    }
  }

  return null;
}

export default function OrdenCliente() {
  // Cargar datos del menú
  const { data: menuData, isLoading: loadingMenu } = useSWR<MenuData>(
    '/api/menu/active',
    fetcher,
    { refreshInterval: 30000 }
  );

  const [items, setItems] = useState<OrderItemState[]>([]);
  const [delivery, setDelivery] = useState(true);
  const [tortillas, setTortillas] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressNote, setAddressNote] = useState('');
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [desiredAt, setDesiredAt] = useState<string>(''); // obligatorio para ambos
  const [slots, setSlots] = useState<{ value: string; label: string }[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

  const [inventory, setInventory] = useState<InventorySnapshot | null>(null);
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  // Helpers para obtener datos del menú
  const getProductByCode = (code: string): MenuProduct | undefined => {
    return menuData?.products.find((p) => p.code === code && p.isActive);
  };

  const getFlavorById = (id: string): Flavor | undefined => {
    return menuData?.flavors.find((f) => f._id === id && f.isActive);
  };

  const getStyleById = (id: string): Style | undefined => {
    return menuData?.styles.find((s) => s._id === id && s.isActive);
  };

  // Obtener el sabor "Sinaloa (Natural)" como default
  const getDefaultFlavor = (): Flavor | undefined => {
    return (
      menuData?.flavors.find(
        (f) => f.isActive && f.name.toLowerCase().includes('sinaloa')
      ) ||
      menuData?.flavors.find(
        (f) => f.isActive && f.name.toLowerCase().includes('natural')
      ) ||
      menuData?.flavors.find((f) => f.isActive)
    );
  };

  // Productos activos para mostrar (excluyendo solo en tienda si es delivery)
  const availableProducts = useMemo(() => {
    if (!menuData) return [];
    return menuData.products.filter((p) => {
      if (!p.isActive) return false;
      if (delivery && p.showOnlyInStore) return false;
      return true;
    });
  }, [menuData, delivery]);

  // ---- estado para modal bonito ----
  const [dialog, setDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    tone: DialogTone;
    onClose?: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    tone: 'info',
  });

  function showDialog(opts: {
    title: string;
    message: string;
    tone?: DialogTone;
    onClose?: () => void;
  }) {
    setDialog({
      open: true,
      title: opts.title,
      message: opts.message,
      tone: opts.tone ?? 'info',
      onClose: opts.onClose,
    });
  }

  // Usar el stream de inventario en tiempo real
  const { inventory: streamInventory, error: streamError } = useInventoryStream();

  useEffect(() => {
    setSlots(buildTimeSlots(8, 'es-MX'));
  }, []);

  // Actualizar inventario cuando el stream cambia
  useEffect(() => {
    if (streamInventory) {
      setInventory(streamInventory);
      if (streamError) {
        setInventoryError(null); // Limpiar errores si se reconecta
      }
    }
  }, [streamInventory]);

  // Mostrar error solo si hay un problema con el stream
  useEffect(() => {
    if (streamError) {
      setInventoryError(streamError);
    }
  }, [streamError]);

  const hasItems = items.length > 0;
  const pedidosCerrados = slots.length === 0;

  // Reglas mínimo para domicilio:
  function canDeliver(ruleItems = items) {
    const c = (k: ItemKind) =>
      ruleItems.reduce((a, it) => a + (it.kind === k ? it.qty : 0), 0);
    const pollo = c('pollo');
    const costiN = c('costillar_normal') + c('costillar_grande');
    const medioPollo = c('medio_pollo');
    const medioCosti = c('costillar_medio');
    return (
      pollo >= 1 ||
      costiN >= 1 ||
      medioPollo >= 2 ||
      medioCosti >= 2 ||
      (medioPollo >= 1 && medioCosti >= 1)
    );
  }
  const deliveryOk = canDeliver(items);

  const total = useMemo(() => {
    if (!hasItems || !menuData) return 0;

    let sub = 0;
    for (const item of items) {
      const product = getProductByCode(item.kind);
      if (!product) continue;

      let itemPrice = product.price;

      // Agregar precio del sabor si existe
      if (item.flavorId) {
        const flavor = getFlavorById(item.flavorId);
        if (flavor) itemPrice += flavor.price;
      }

      sub += itemPrice * item.qty;
    }

    const surcharge = delivery && deliveryOk ? 20 : 0;
    return sub + surcharge + tortillas * 10;
  }, [items, delivery, deliveryOk, tortillas, hasItems, menuData]);

  // Añadir producto respetando inventario
  function add(kind: ItemKind) {
    if (!menuData) return;

    const product = getProductByCode(kind);
    if (!product) return;

    setItems((current) => {
      const base: OrderItemState = {
        kind,
        qty: 1,
        productId: product._id,
      };

      // Estilos (pollos)
      const activeStyles = product.availableStyles
        .map((s) => menuData?.styles.find((st) => st._id === s._id))
        .filter((s): s is Style => s !== undefined && s.isActive);

      if (activeStyles.length > 0) {
        const firstStyle = activeStyles[0];
        base.chickenStyle = firstStyle.name;
        base.styleId = firstStyle._id;
      }

      // Sabores
      const activeFlavors = product.availableFlavors
        .map((f) => menuData?.flavors.find((fl) => fl._id === f._id))
        .filter((f): f is Flavor => f !== undefined && f.isActive);

      if (activeFlavors.length > 0) {
        const sinaloaFlavor =
          activeFlavors.find(
            (f) =>
              f.name.toLowerCase().includes('sinaloa') ||
              f.name.toLowerCase().includes('natural')
          ) || activeFlavors[0];

        base.flavor = sinaloaFlavor.name;
        base.flavorId = sinaloaFlavor._id;
      }

      const next = [base, ...current];

      if (inventory) {
        const err = validateInventoryForKind(next, inventory, kind);
        if (err) {
          showDialog({
            title: 'Sin stock suficiente',
            message: err,
            tone: 'error',
          });
          return current;
        }
      }

      return next;
    });
  }

  // Incrementar cantidad de una línea respetando inventario
  function incrementItem(idx: number) {
    setItems((current) => {
      const target = current[idx];
      if (!target) return current;

      const next = current.map((x, i) =>
        i === idx ? { ...x, qty: x.qty + 1 } : x
      );

      if (inventory) {
        const err = validateInventoryForKind(next, inventory, target.kind);
        if (err) {
          showDialog({
            title: 'Sin stock suficiente',
            message: err,
            tone: 'error',
          });
          return current;
        }
      }

      return next;
    });
  }

  useEffect(() => {
    if (delivery && !deliveryOk) {
      setMsg(
        'Completa tu orden con un pollo completo, un costillar o 2 medios (pollo o costillar) para poder enviar a domicilio. De lo contrario, confirma como Pick Up.'
      );
    } else {
      setMsg(null);
    }
  }, [delivery, deliveryOk]);

  // Asegurar que siempre haya sabor y estilo seleccionados cuando se actualiza el menú
  useEffect(() => {
    if (!menuData) return;

    setItems((current) =>
      current.map((item) => {
        const product = getProductByCode(item.kind);
        if (!product) return item;

        let updated = { ...item };
        const isChicken = product.availableStyles.length > 0;

        const availableFlavors = product.availableFlavors
          .map((f) => menuData.flavors.find((fl) => fl._id === f._id))
          .filter((f): f is Flavor => f !== undefined && f.isActive);

        const availableStyles = product.availableStyles
          .map((s) => menuData.styles.find((st) => st._id === s._id))
          .filter((s): s is Style => s !== undefined && s.isActive);

        // Asegurar estilo seleccionado para pollos
        if (isChicken) {
          const currentStyle = item.styleId ? getStyleById(item.styleId) : null;
          if (!currentStyle && availableStyles.length > 0) {
            updated.styleId = availableStyles[0]._id;
            updated.chickenStyle = availableStyles[0].name;
          }
        }

        // Determinar si el estilo actual es "asado"
        const updatedStyle = updated.styleId ? getStyleById(updated.styleId) : null;
        const isAsado = updatedStyle?.name === 'asado';
        const defaultFlavor = getDefaultFlavor();

        // Asegurar sabor seleccionado
        const currentFlavor = updated.flavorId ? getFlavorById(updated.flavorId) : null;

        if (!currentFlavor) {
          if (
            defaultFlavor &&
            availableFlavors.some((f) => f._id === defaultFlavor._id)
          ) {
            updated.flavorId = defaultFlavor._id;
            updated.flavor = defaultFlavor.name;
          } else if (availableFlavors.length > 0) {
            updated.flavorId = availableFlavors[0]._id;
            updated.flavor = availableFlavors[0].name;
          }
        } else if (!isAsado) {
          // Si el estilo no es "asado", forzar "Sinaloa (Natural)"
          if (
            defaultFlavor &&
            availableFlavors.some((f) => f._id === defaultFlavor._id)
          ) {
            updated.flavorId = defaultFlavor._id;
            updated.flavor = defaultFlavor.name;
          }
        }

        return updated;
      })
    );
  }, [menuData]);

  // ---------- VALIDACIONES EN DOS FASES ----------

  // 1) Valida SOLO el pedido (productos + mínimo + stock)
  function validateOrder(baseMode: 'pickup' | 'delivery') {
    const errs: string[] = [];
    if (!hasItems) errs.push('Agrega al menos un producto a tu pedido.');
    if (baseMode === 'delivery' && !deliveryOk) {
      errs.push('Completa tu pedido para cumplir el mínimo de envío a domicilio.');
    }
    if (pedidosCerrados) {
      errs.push('El horario de pedidos en línea es de 12:00 pm a 6:00 pm.');
    }
    if (inventory) {
      const invErr = validateInventoryGlobal(items, inventory);
      if (invErr) errs.push(invErr);
    }
    return errs;
  }

  // 2) Valida datos del cliente
  function validateCustomer(baseMode: 'pickup' | 'delivery') {
    const errs: string[] = [];

    if (!name.trim()) errs.push('El nombre es obligatorio.');
    if (!phone.trim()) errs.push('El teléfono es obligatorio.');
    else if (!isValidMxPhone(phone))
      errs.push('Teléfono inválido. Debe tener 10 dígitos en MX.');
    if (!desiredAt) errs.push('Selecciona un horario.');

    if (baseMode === 'delivery') {
      if (!geo) errs.push('Selecciona tu ubicación en el mapa.');
      if (!addressNote.trim()) errs.push('La dirección / referencias es obligatoria.');
      if (!delivery) errs.push('Activa “Entrega a domicilio”.');
    }

    return errs;
  }

  async function submit(mode: 'pickup' | 'delivery') {
    // Fase 1: validar pedido
    const orderErrs = validateOrder(mode);
    if (orderErrs.length > 0) {
      setFormErrors(orderErrs);
      showDialog({
        title: mode === 'delivery' ? 'Completa tu pedido' : 'Agrega productos a tu pedido',
        message:
          mode === 'delivery'
            ? 'Antes de continuar, completa tu pedido para envío a domicilio (agrega producto, cumple el mínimo o ajusta el stock).'
            : 'Antes de continuar, agrega al menos un producto y revisa que no sobrepase el stock.',
        tone: 'error',
      });
      return;
    }

    // Fase 2: validar datos del cliente
    const customerErrs = validateCustomer(mode);
    setFormErrors(customerErrs);
    if (customerErrs.length > 0) {
      showDialog({
        title: 'Revisa tus datos',
        message: 'Faltan datos obligatorios. Revisa el cuadro rojo de errores antes de confirmar.',
        tone: 'error',
      });
      return;
    }

    const wantDelivery = mode === 'delivery';

    const itemsForSubmit = items.map((item) => ({
      kind: item.kind,
      qty: item.qty,
      flavor: item.flavor,
      flavorId: item.flavorId,
      chickenStyle: item.chickenStyle,
      styleId: item.styleId,
      productId: item.productId,
    }));

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'cliente',
        items: itemsForSubmit,
        delivery: wantDelivery,
        tortillasPacks: tortillas,
        customer: {
          name,
          phone,
          desiredAt,
          ...(wantDelivery ? { addressNote, geo } : {}),
        },
      }),
    });

    if (res.ok) {
      showDialog({
        title: 'Pedido enviado',
        message: wantDelivery
          ? 'Pedido enviado. Paga en efectivo al recibir.'
          : 'Pedido para recoger confirmado.',
        tone: 'success',
        onClose: () => {
          window.location.href = '/';
        },
      });
    } else {
      const j = await res.json();
      showDialog({
        title: 'Error',
        message: j.error || 'Hubo un problema al enviar tu pedido. Intenta de nuevo.',
        tone: 'error',
      });
    }
  }

  // Geolocalización robusta (navigator)
  async function getLocation() {
    if (!('geolocation' in navigator)) {
      showDialog({
        title: 'Sin GPS',
        message: 'Tu navegador no soporta GPS. Ingresa referencias detalladas en la dirección.',
        tone: 'info',
      });
      return;
    }

    let best: GeolocationPosition | null = null;
    let closed = false;

    const commit = async (p: GeolocationPosition) => {
      if (closed) return;
      closed = true;
      const g = { lat: p.coords.latitude, lng: p.coords.longitude };
      setGeo(g);
      setGpsAccuracy(Math.round(p.coords.accuracy));
      if (p.coords.accuracy > 60) setShowMap(true);

      try {
        const q = new URLSearchParams({
          format: 'jsonv2',
          lat: String(g.lat),
          lon: String(g.lng),
        });
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?${q.toString()}`, {
          headers: { Accept: 'application/json' },
        });
        const j = await r.json();
        const addr = j?.display_name || '';
        if (addr) setAddressNote(addr);
      } catch {}
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        best = pos;
        setGpsAccuracy(Math.round(pos.coords.accuracy));
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );

    const watcher = navigator.geolocation.watchPosition(
      (pos) => {
        if (!best || pos.coords.accuracy < best.coords.accuracy) {
          best = pos;
          setGpsAccuracy(Math.round(pos.coords.accuracy));
        }
        if (pos.coords.accuracy <= 25) {
          navigator.geolocation.clearWatch(watcher);
          commit(pos);
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    );

    setTimeout(() => {
      try {
        navigator.geolocation.clearWatch(watcher);
      } catch {}
      if (best) commit(best);
      else {
        showDialog({
          title: 'No se pudo obtener ubicación',
          message:
            'No logramos leer tu ubicación automáticamente. Puedes ajustar el punto en el mapa o escribir referencias claras en la dirección.',
          tone: 'info',
        });
      }
    }, 12000);
  }

  // Si se desactiva domicilio, limpiamos coordenadas
  useEffect(() => {
    if (!delivery) setGeo(null);
  }, [delivery]);

  const showCustomerForms = hasItems && (!delivery || (delivery && deliveryOk));

  const actionHint = useMemo(() => {
    if (pedidosCerrados) return 'Los pedidos en línea están disponibles de 12:00 pm a 6:00 pm.';
    if (!hasItems) return 'Agrega al menos un producto para continuar.';
    if (delivery && !deliveryOk)
      return 'Completa tu pedido con un pollo completo, un costillar o 2 medios para poder enviar a domicilio.';
    if (delivery) {
      if (!geo) return 'Toca “Usar mi ubicación” y agrega referencias.';
      return 'Todo listo, revisa tus datos y confirma tu pedido a domicilio.';
    }
    return 'Revisa tu horario y datos para confirmar tu pedido para recoger.';
  }, [hasItems, delivery, deliveryOk, geo, pedidosCerrados]);

  // Para ocultar botones si se acabó inventario (solo para productos que dependen de esas llaves)
  const noPollo = inventory && inventory.pollo <= 0;
  const noCostillarNormal = inventory && inventory.costillar_normal <= 0;
  const noCostillarGrande = inventory && inventory.costillar_grande <= 0;

  return (
    <>
      <main className="space-y-6 md:space-y-8">
        {/* Hero */}
        <section className="card bg-gradient-to-r from-amber-900/60 via-zinc-900 to-black border border-zinc-800/70 shadow-xl">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
            <div className="shrink-0 rounded-2xl bg-black/40 p-2 border border-amber-500/30">
              <Image
                src="/logo.png"
                alt="Pollos Don Agus"
                width={72}
                height={72}
                className="rounded-xl"
              />
            </div>
            <div className="flex-1 space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-[11px] text-amber-200 border border-amber-500/30">
                <span>🍗 Pedido en línea</span>
                <span className="opacity-60">• Cliente</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold">
                Arma tu pedido en minutos
              </h1>
              <p className="text-sm md:text-base text-zinc-300">
                Pollos asados/rostizados y costillas a la leña. Haz tu orden,
                elige hora y decide si quieres recoger en local o recibir en casa.
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-zinc-400 pt-1">
                <span>1. Elige tus productos</span>
                <span>• 2. Completa tus datos</span>
                <span>• 3. Confirma Pick Up o Domicilio</span>
              </div>
              {inventoryError && (
                <p className="text-[11px] text-amber-300 pt-1">
                  {inventoryError}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Productos */}
        <section className="space-y-3">
          <header className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">Elige tu antojo</h2>
              <p className="text-xs text-zinc-400">
                Agrega pollos y costillas a tu pedido. Puedes ajustar cantidades
                después.
              </p>
            </div>
            <span className="text-[11px] text-zinc-500">
              Envío disponible con mínimo de pedido
            </span>
          </header>

          {loadingMenu ? (
            <div className="text-center py-8 text-zinc-400">
              <p>Cargando productos del menú...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {availableProducts.map((product) => {
                  const isChicken = product.code === 'pollo' || product.code === 'medio_pollo';
                  const isRibNormal = product.code === 'costillar_medio' || product.code === 'costillar_normal';
                  const isRibGrande = product.code === 'costillar_grande';

                  const hideByStock =
                    (isChicken && inventory && noPollo) ||
                    (isRibNormal && inventory && noCostillarNormal) ||
                    (isRibGrande && inventory && noCostillarGrande);

                  if (hideByStock) return null;

                  return (
                    <button
                      key={product._id}
                      className="card hover:ring-2 ring-amber-500/60 transition hover:-translate-y-0.5 text-left flex flex-col justify-between"
                      onClick={() => add(product.code)}
                      disabled={pedidosCerrados}
                    >
                      <div>
                        {product.showOnlyInStore && (
                          <div className="text-xs text-orange-300 mb-1">
                            ⚠️ Solo en tienda
                          </div>
                        )}
                        <div className="font-semibold">{product.name}</div>
                        <div className="text-xs text-zinc-400 mt-1">
                          {product.description || 'Delicioso producto a la leña.'}
                        </div>
                      </div>
                      <div className="mt-3 text-[11px] text-zinc-400">
                        ${product.price} pickup
                        {!product.showOnlyInStore && ' • +$20 envío (por pedido)'}
                      </div>
                    </button>
                  );
                })}
              </div>

              {inventory && noPollo && noCostillarNormal && noCostillarGrande && (
                <p className="text-xs text-red-300">
                  No hay stock disponible de pollos ni costillares en este momento.
                </p>
              )}
            </>
          )}
        </section>

        {/* Carrito */}
        <section className="card space-y-3">
          <header className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">Tu pedido</h2>
              <p className="text-xs text-zinc-400">
                Ajusta sabores, preparación y cantidades.
              </p>
            </div>
            <span className="text-[11px] text-zinc-500">
              {hasItems ? `${items.length} línea(s) en el pedido` : 'Sin productos aún'}
            </span>
          </header>

          {!hasItems && (
            <div className="rounded-lg border border-dashed border-zinc-700 py-6 text-center text-sm text-zinc-500">
              Aún no has agregado nada. Empieza seleccionando un pollo o
              costillar de la parte superior.
            </div>
          )}

          {items.map((it, idx) => {
            const product = getProductByCode(it.kind);
            if (!product || !menuData) return null;

            const isChicken = product.availableStyles.length > 0;
            const isRib = product.availableFlavors.length > 0 && !isChicken;

            const availableFlavors = product.availableFlavors
              .map((f) => menuData.flavors.find((fl) => fl._id === f._id))
              .filter((f): f is Flavor => f !== undefined && f.isActive);

            const availableStyles = product.availableStyles
              .map((s) => menuData.styles.find((st) => st._id === s._id))
              .filter((s): s is Style => s !== undefined && s.isActive);

            const currentStyle = it.styleId ? getStyleById(it.styleId) : null;
            const isAsado = currentStyle?.name === 'asado';

            let linePrice = product.price;
            if (it.flavorId) {
              const flavor = getFlavorById(it.flavorId);
              if (flavor) linePrice += flavor.price;
            }
            linePrice *= it.qty;

            const styleName = it.styleId
              ? getStyleById(it.styleId)?.displayName || it.chickenStyle
              : it.chickenStyle;

            return (
              <div
                key={idx}
                className="grid items-center gap-3 py-3 border-b border-zinc-800 last:border-none text-sm"
                style={{
                  gridTemplateColumns: isChicken
                    ? 'minmax(120px,1.1fr) minmax(140px,1.1fr) minmax(140px,1fr) 80px 160px'
                    : 'minmax(120px,1.1fr) minmax(140px,1.1fr) 80px 160px',
                }}
              >
                {/* Descripción item */}
                <div className="space-y-1">
                  <div className="font-semibold">{product.name}</div>
                  {isChicken && styleName && (
                    <div className="text-[11px] text-zinc-400">
                      {styleName === 'asado' || styleName === 'Asado'
                        ? `Asado • ${it.flavor || 'Sinaloa (Natural)'}`
                        : `${styleName} • Sinaloa (Natural)`}
                    </div>
                  )}
                </div>

                {/* Sabor */}
                {isChicken && availableFlavors.length > 0 ? (
                  <div>
                    <label className="text-[11px] text-zinc-400">
                      Sabor {!isAsado && '(solo en asado)'}
                    </label>
                    <select
                      className="input w-full mt-1 disabled:opacity-50"
                      disabled={!isAsado}
                      value={it.flavorId || ''}
                      onChange={(e) => {
                        const flavorId = e.target.value;
                        const flavor = getFlavorById(flavorId);
                        if (flavor) {
                          setItems((s) =>
                            s.map((x, i) =>
                              i === idx ? { ...x, flavorId, flavor: flavor.name } : x
                            )
                          );
                        }
                      }}
                    >
                      {availableFlavors.map((f) => (
                        <option key={f._id} value={f._id}>
                          {f.name} {f.price > 0 ? `(+$${f.price})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : isRib && availableFlavors.length > 0 ? (
                  <div>
                    <label className="text-[11px] text-zinc-400">Sabor</label>
                    <select
                      className="input w-full mt-1"
                      value={it.flavorId || ''}
                      onChange={(e) => {
                        const flavorId = e.target.value;
                        const flavor = getFlavorById(flavorId);
                        if (flavor) {
                          setItems((s) =>
                            s.map((x, i) =>
                              i === idx ? { ...x, flavorId, flavor: flavor.name } : x
                            )
                          );
                        }
                      }}
                    >
                      {availableFlavors.map((f) => (
                        <option key={f._id} value={f._id}>
                          {f.name} {f.price > 0 ? `(+$${f.price})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div />
                )}

                {/* Preparación */}
                {isChicken && availableStyles.length > 0 && (
                  <div>
                    <label className="text-[11px] text-zinc-400">Preparación</label>
                    <select
                      className="input w-full mt-1"
                      value={it.styleId || ''}
                      onChange={(e) => {
                        const styleId = e.target.value;
                        const style = getStyleById(styleId);
                        if (style) {
                          const isAs = style.name === 'asado';
                          const defaultFlavor = getDefaultFlavor();

                          setItems((s) =>
                            s.map((x, i) => {
                              if (i !== idx) return x;

                              if (
                                !isAs &&
                                defaultFlavor &&
                                availableFlavors.some((f) => f._id === defaultFlavor._id)
                              ) {
                                return {
                                  ...x,
                                  styleId,
                                  chickenStyle: style.name,
                                  flavorId: defaultFlavor._id,
                                  flavor: defaultFlavor.name,
                                };
                              }

                              return {
                                ...x,
                                styleId,
                                chickenStyle: style.name,
                                flavorId: x.flavorId || (defaultFlavor?._id || ''),
                                flavor: x.flavor || (defaultFlavor?.name || ''),
                              };
                            })
                          );
                        }
                      }}
                    >
                      {availableStyles.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.displayName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Precio */}
                <div className="text-right font-semibold text-zinc-100">${linePrice}</div>

                {/* Cantidad + quitar */}
                <div className="flex items-center justify-end gap-2">
                  <button
                    className="btn h-8 w-8 !p-0 !leading-none flex items-center justify-center"
                    aria-label="Disminuir"
                    onClick={() =>
                      setItems((s) =>
                        s.map((x, i) =>
                          i === idx ? { ...x, qty: Math.max(1, x.qty - 1) } : x
                        )
                      )
                    }
                  >
                    <span className="text-base">−</span>
                  </button>

                  <div className="min-w-[2ch] text-center">{it.qty}</div>

                  <button
                    className="btn h-8 w-8 !p-0 !leading-none flex items-center justify-center"
                    aria-label="Aumentar"
                    onClick={() => incrementItem(idx)}
                  >
                    <span className="text-base">+</span>
                  </button>

                  <button
                    aria-label="Quitar"
                    className="btn h-8 w-8 !p-0 !leading-none flex items-center justify-center bg-red-600 hover:bg-red-500"
                    onClick={() => setItems((s) => s.filter((_, i) => i !== idx))}
                    title="Quitar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </section>

        {/* Opciones */}
        <section className="grid md:grid-cols-3 gap-4">
          {/* Entrega a domicilio */}
          <div
            className={`card flex flex-col gap-3 transition-all border-2 ${
              delivery
                ? deliveryOk
                  ? 'border-emerald-500/80 bg-emerald-900/25 shadow-[0_0_25px_rgba(16,185,129,0.35)]'
                  : 'border-red-500/90 bg-red-900/25 shadow-[0_0_25px_rgba(239,68,68,0.45)]'
                : 'border-zinc-800 bg-zinc-900/80'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold">Entrega a domicilio</div>
                <div className="text-xs text-zinc-300 mt-1">
                  + $20 por pedido • paga en efectivo al recibir.
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 text-xs text-zinc-200">
                <div className="inline-flex items-center gap-2">
                  <span>{delivery ? 'Sí' : 'No'}</span>
                  <DeliverySwitch
                    checked={delivery}
                    onChange={setDelivery}
                    tone={delivery && !deliveryOk ? 'error' : 'ok'}
                  />
                </div>
              </div>
            </div>

            {msg && (
              <div className="mt-1 text-xs rounded-md bg-amber-500/10 border border-amber-500/40 text-amber-200 px-3 py-2">
                {msg}
              </div>
            )}

            {gpsAccuracy != null && geo && gpsAccuracy < 3000 && (
              <div className="text-[11px] text-zinc-400">
                Precisión GPS aprox.: ±{gpsAccuracy} m
              </div>
            )}

            <p className="text-[11px] text-zinc-500 pt-1">
              Si desactivas la entrega, tu pedido será para recoger en el local.
            </p>
          </div>

          {/* Tortillas */}
          <div className="card flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold">Tortillas extra</div>
              <div className="text-sm text-zinc-400">$10 por paquete adicional.</div>
              <div className="text-[11px] text-zinc-500 mt-1">
                Ideal si son varios o quieres asegurar que alcance.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn h-8 w-8 !p-0 flex items-center justify-center"
                onClick={() => setTortillas(Math.max(0, tortillas - 1))}
              >
                −
              </button>
              <div className="min-w-[3ch] text-center text-lg">{tortillas}</div>
              <button
                className="btn h-8 w-8 !p-0 flex items-center justify-center"
                onClick={() => setTortillas(tortillas + 1)}
              >
                +
              </button>
            </div>
          </div>

          {/* Total */}
          <div className="card flex flex-col justify-between gap-2">
            <div>
              <div className="font-semibold">Total estimado</div>
              <div className="text-3xl font-extrabold mt-1">${total}</div>
            </div>
            <div className="text-[11px] text-zinc-400">
              {delivery
                ? deliveryOk
                  ? 'Incluye envío (pedido cumple el mínimo).'
                  : 'Aún no incluye envío: tu pedido no cumple el mínimo para domicilio.'
                : 'No incluye envío porque seleccionaste Pick Up.'}
            </div>
          </div>
        </section>

        {/* Datos cliente */}
        <section className="card space-y-4">
          <header className="space-y-1">
            <h2 className="text-lg font-semibold">Datos para tu pedido</h2>
            <p className="text-xs text-zinc-400">
              Estos datos solo se usan para coordinar tu pedido y entrega.
            </p>
          </header>

          {formErrors.length > 0 && (
            <ul className="text-red-300 text-sm bg-red-950/40 border border-red-800 rounded-lg p-3 space-y-1">
              {formErrors.map((e, i) => (
                <li key={i}>• {e}</li>
              ))}
            </ul>
          )}

          {showCustomerForms ? (
            <>
              {/* Fila 1 */}
              <div className="grid md:grid-cols-3 gap-4 items-end">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-zinc-200 text-center md:text-left">
                    Nombre *
                  </label>
                  <input
                    className="input h-9 text-sm"
                    placeholder="Tu nombre"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-zinc-200 text-center md:text-left">
                    Teléfono *
                  </label>
                  <input
                    className="input h-9 text-sm"
                    placeholder="10 dígitos (MX)"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-zinc-200 text-center md:text-left">
                    Horario deseado *
                  </label>
                  <select
                    className="input h-9 text-sm"
                    value={desiredAt}
                    onChange={(e) => setDesiredAt(e.target.value)}
                    suppressHydrationWarning
                  >
                    <option value="" disabled>
                      {pedidosCerrados ? 'Horario cerrado (12:00–18:00)' : 'Selecciona una hora'}
                    </option>
                    {slots.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fila 2/3 */}
              {delivery ? (
                <div className="space-y-3">
                  <div className="grid md:grid-cols-[auto,1fr] gap-3 items-center">
                    <div className="flex flex-wrap gap-2">
                      <button className="btn h-10 px-4" onClick={getLocation}>
                        Usar mi ubicación
                      </button>
                      {geo && (
                        <button className="btn h-10 px-4" onClick={() => setShowMap(true)}>
                          Ajustar en mapa
                        </button>
                      )}
                    </div>
                    <span className="text-xs md:text-sm text-zinc-400">
                      {geo
                        ? `Ubicación guardada: (${geo.lat.toFixed(5)}, ${geo.lng.toFixed(5)})`
                        : 'Aún no se ha seleccionado ubicación.'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-zinc-200">
                      Dirección / referencias para el repartidor *
                    </label>
                    <textarea
                      className="input text-sm min-h-[96px] w-full max-w-none"
                      placeholder="Ej. Frente a la plaza, portón negro, segunda casa..."
                      value={addressNote}
                      onChange={(e) => setAddressNote(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-400">
                  Como seleccionaste <span className="font-semibold">Pick Up</span>, solo necesitamos tus datos básicos y la hora aproximada.
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-zinc-400">
              Primero arma tu pedido. Una vez que tengas los productos seleccionados{' '}
              {delivery && !deliveryOk ? 'y cumplas el mínimo para domicilio ' : ''}
              te pediremos tus datos para coordinar la entrega.
            </p>
          )}
        </section>

        {/* Mapa para Pick Up */}
        {!delivery && hasItems && (
          <section className="card grid gap-3">
            <div>
              <h2 className="text-lg font-semibold">Ubicación para Pick Up</h2>
              <p className="text-sm text-zinc-400 mt-1">
                Pasa a recoger tu pedido en el local a la hora que elegiste.
              </p>
            </div>
            <div className="text-sm text-zinc-300">{BUSINESS_ADDR}</div>
            <div className="h-64 rounded-xl overflow-hidden border border-zinc-800">
              <iframe
                src={BUSINESS_IFRAME_SRC}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </section>
        )}

        {/* Acciones */}
        <section className="grid gap-2">
          {delivery ? (
            <button
              className="btn h-14 rounded-full border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 flex items-center justify-center gap-2 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => submit('delivery')}
              disabled={pedidosCerrados}
            >
              <span>🚚</span>
              <span>Confirmar pedido a domicilio</span>
            </button>
          ) : (
            <button
              className="btn h-14 rounded-full border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 flex items-center justify-center gap-2 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => submit('pickup')}
              disabled={pedidosCerrados}
            >
              <span>🛍️</span>
              <span>Confirmar pedido para recoger</span>
            </button>
          )}

          <p className="text-xs text-zinc-400 text-center">{actionHint}</p>
        </section>

        {/* Modal mapa */}
        <MapPicker
          open={showMap}
          onClose={() => setShowMap(false)}
          value={geo}
          onChange={(ll, addr) => {
            setGeo(ll);
            if (addr) setAddressNote(addr);
          }}
        />
      </main>

      {/* Modal feedback */}
      {dialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div
            className={`card max-w-md w-full text-center border-2 ${
              dialog.tone === 'success'
                ? 'border-emerald-500/80 bg-emerald-950/80'
                : dialog.tone === 'error'
                ? 'border-red-500/80 bg-red-950/80'
                : 'border-amber-400/80 bg-zinc-950/90'
            }`}
          >
            <div className="space-y-2">
              <div className="text-3xl">
                {dialog.tone === 'success' ? '✅' : dialog.tone === 'error' ? '⚠️' : 'ℹ️'}
              </div>
              <h3 className="text-lg font-semibold">{dialog.title}</h3>
              <p className="text-sm text-zinc-200 whitespace-pre-line">{dialog.message}</p>
            </div>
            <div className="mt-5 flex justify-center">
              <button
                className="btn px-6"
                onClick={() => {
                  const cb = dialog.onClose;
                  setDialog((d) => ({ ...d, open: false }));
                  cb?.();
                }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
