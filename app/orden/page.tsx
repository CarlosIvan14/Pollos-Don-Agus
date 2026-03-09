// app/orden/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Trash2 } from 'lucide-react';
import useSWR from 'swr';
import { useInventoryStream } from '@/lib/useInventoryStream';
import { useLanguage } from '@/lib/useLanguage';

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
  const opening = todayAt(10, 0); // 10:00
  const closing = todayAt(22, 0); // 22:00
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

function interpolate(
  template: string,
  params: Record<string, string | number>
) {
  let output = template;
  for (const [key, value] of Object.entries(params)) {
    output = output.replaceAll(`{${key}}`, String(value));
  }
  return output;
}

function validateInventoryGlobal(
  items: OrderItemState[],
  inv: InventorySnapshot,
  orderText: any
): string | null {
  const usage = getInventoryUsageFromItems(items);

  for (const key of Object.keys(usage)) {
    const used = usage[key] ?? 0;
    const available = (inv as any)[key] ?? 0;

    if (used > available) {
      if (key === 'pollo') {
        return interpolate(orderText.validation.stockPollo, { max: inv.pollo });
      }
      if (key === 'costillar_normal') {
        return interpolate(orderText.validation.stockCostillarNormal, {
          max: inv.costillar_normal,
        });
      }
      if (key === 'costillar_grande') {
        return interpolate(orderText.validation.stockCostillarGrande, {
          max: inv.costillar_grande,
        });
      }

      return interpolate(orderText.validation.stockGeneric, { key, available });
    }
  }

  return null;
}

function validateInventoryForKind(
  items: OrderItemState[],
  inv: InventorySnapshot,
  changedKind: ItemKind,
  orderText: any
): string | null {
  const rules = CONSUMPTION[changedKind] ?? [{ inventoryKey: changedKind, factor: 1 }];
  const usage = getInventoryUsageFromItems(items);

  for (const r of rules) {
    const key = r.inventoryKey as string;
    const used = usage[key] ?? 0;
    const available = (inv as any)[key] ?? 0;

    if (used > available) {
      if (key === 'pollo') {
        return interpolate(orderText.validation.stockPollo, { max: inv.pollo });
      }
      if (key === 'costillar_normal') {
        return interpolate(orderText.validation.stockCostillarNormal, {
          max: inv.costillar_normal,
        });
      }
      if (key === 'costillar_grande') {
        return interpolate(orderText.validation.stockCostillarGrande, {
          max: inv.costillar_grande,
        });
      }
      return interpolate(orderText.validation.stockGeneric, { key, available });
    }
  }

  return null;
}

export default function OrdenCliente() {
  const { t } = useLanguage();

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
  const [searchQuery, setSearchQuery] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
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
    let filtered = menuData.products.filter((p) => {
      if (!p.isActive) return false;
      if (delivery && p.showOnlyInStore) return false;
      return true;
    });

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [menuData, delivery, searchQuery]);

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
        const err = validateInventoryForKind(next, inventory, kind, t.order);
        if (err) {
          showDialog({
            title: t.order.stockErrorTitle,
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
        const err = validateInventoryForKind(next, inventory, target.kind, t.order);
        if (err) {
          showDialog({
            title: t.order.stockErrorTitle,
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
      setMsg(t.order.deliveryRequirementLong);
    } else {
      setMsg(null);
    }
  }, [delivery, deliveryOk, t.order.deliveryRequirementLong]);

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
    if (!hasItems) errs.push(t.order.validation.addAtLeastOne);
    if (baseMode === 'delivery' && !deliveryOk) {
      errs.push(t.order.validation.deliveryMinimum);
    }
    if (pedidosCerrados) {
      errs.push(t.order.validation.onlineHours);
    }
    if (inventory) {
      const invErr = validateInventoryGlobal(items, inventory, t.order);
      if (invErr) errs.push(invErr);
    }
    return errs;
  }

  // 2) Valida datos del cliente
  function validateCustomer(baseMode: 'pickup' | 'delivery') {
    const errs: string[] = [];

    if (!name.trim()) errs.push(t.order.validation.nameRequired);
    if (!phone.trim()) errs.push(t.order.validation.phoneRequired);
    else if (!isValidMxPhone(phone))
      errs.push(t.order.validation.phoneInvalid);
    if (!desiredAt) errs.push(t.order.validation.scheduleRequired);

    if (baseMode === 'delivery') {
      if (!geo) errs.push(t.order.validation.mapRequired);
      if (!addressNote.trim()) errs.push(t.order.validation.addressRequired);
      if (!delivery) errs.push(t.order.validation.activateDelivery);
    }

    return errs;
  }

  async function submit(mode: 'pickup' | 'delivery') {
    // Fase 1: validar pedido
    const orderErrs = validateOrder(mode);
    if (orderErrs.length > 0) {
      setFormErrors(orderErrs);
      showDialog({
        title:
          mode === 'delivery'
            ? t.order.dialogs.completeOrderTitle
            : t.order.dialogs.addProductsTitle,
        message:
          mode === 'delivery'
            ? t.order.dialogs.completeOrderDeliveryMsg
            : t.order.dialogs.completeOrderPickupMsg,
        tone: 'error',
      });
      return;
    }

    // Fase 2: validar datos del cliente
    const customerErrs = validateCustomer(mode);
    setFormErrors(customerErrs);
    if (customerErrs.length > 0) {
      showDialog({
        title: t.order.dialogs.checkDataTitle,
        message: t.order.dialogs.checkDataMsg,
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
        title: t.order.orderSent,
        message: wantDelivery
          ? t.order.orderSentDesc
          : t.order.orderConfirmed,
        tone: 'success',
        onClose: () => {
          window.location.href = '/';
        },
      });
    } else {
      const j = await res.json();
      showDialog({
        title: t.order.error,
        message: j.error || t.order.errorDesc,
        tone: 'error',
      });
    }
  }

  // Geolocalización robusta (navigator)
  async function getLocation() {
    if (!('geolocation' in navigator)) {
      showDialog({
        title: t.order.dialogs.noGpsTitle,
        message: t.order.dialogs.noGpsMsg,
        tone: 'info',
      });
      return;
    }

    setGettingLocation(true);

    let best: GeolocationPosition | null = null;
    let closed = false;

    const commit = async (p: GeolocationPosition) => {
      if (closed) return;
      closed = true;
      setGettingLocation(false);
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
        setGettingLocation(false);
        showDialog({
          title: t.order.dialogs.noLocationTitle,
          message: t.order.dialogs.noLocationMsg,
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
    if (pedidosCerrados) return t.order.hints.onlineClosed;
    if (!hasItems) return t.order.hints.addProduct;
    if (delivery && !deliveryOk)
      return t.order.hints.deliveryMinimum;
    if (delivery) {
      if (!geo) return t.order.hints.addProduct;
      return t.order.hints.deliveryReady;
    }
    return t.order.hints.pickupReady;
  }, [hasItems, delivery, deliveryOk, geo, pedidosCerrados, t]);

  // Para ocultar botones si se acabó inventario (solo para productos que dependen de esas llaves)
  const noPollo = inventory && inventory.pollo <= 0;
  const noCostillarNormal = inventory && inventory.costillar_normal <= 0;
  const noCostillarGrande = inventory && inventory.costillar_grande <= 0;

  return (
    <>
      <main className="space-y-4 md:space-y-6">
        {/* Mensaje si está cerrado */}
        {pedidosCerrados && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 backdrop-blur-sm p-4 md:p-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">🕐</div>
              <div>
                <h3 className="font-bold text-red-300 text-base md:text-lg">
                  {t.order.ui.closedTitle}
                </h3>
                <p className="text-red-200/80 text-sm mt-1">
                  {t.order.ui.closedSchedule}
                </p>
                <p className="text-red-200/70 text-xs mt-2">
                  {t.order.ui.closedComeBack}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Hero */}
        {!pedidosCerrados && (
          <section className="card bg-gradient-to-r from-amber-900/50 via-zinc-900 to-black border border-zinc-800/70">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
              <div className="shrink-0 hidden md:block rounded-xl bg-black/40 p-2 border border-amber-500/20">
                <Image
                  src="/logo.png"
                  alt="Pollos Don Agus"
                  width={56}
                  height={56}
                  className="rounded-lg"
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {t.order.title}
                </h1>
                <p className="text-sm text-zinc-300">
                  {t.order.subtitle}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Contenedor principal responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Columna izquierda: Productos y carrito (2/3 en desktop) */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">

        {/* Productos */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">{t.order.chooseProduct}</h2>
              <p className="text-sm text-zinc-400 mt-1">
                {t.order.chooseProductDesc}
              </p>
            </div>
          </div>

          {loadingMenu ? (
            <div className="text-center py-12 text-zinc-400">
              <p>{t.order.ui.loadingMenu}</p>
            </div>
          ) : (
            <>
              {/* Search bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder={t.order.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              {/* Grid de productos */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 auto-rows-max">
                {availableProducts.map((product) => {
                  const isChicken = product.code === 'pollo' || product.code === 'medio_pollo';
                  const isRibNormal = product.code === 'costillar_medio' || product.code === 'costillar_normal';
                  const isRibGrande = product.code === 'costillar_grande';

                  const hideByStock =
                    (isChicken && inventory && noPollo) ||
                    (isRibNormal && inventory && noCostillarNormal) ||
                    (isRibGrande && inventory && noCostillarGrande);

                  if (hideByStock) return null;

                  const imageMap: Record<string, string> = {
                    'pollo': '/menu/pollo-completo.png',
                    'medio_pollo': '/menu/medio-pollo.png',
                    'costillar_normal': '/menu/costillar.png',
                    'costillar_medio': '/menu/medio-costillar.png',
                    'costillar_grande': '/menu/costillar-grande.png',
                  };

                  const imageSrc = imageMap[product.code] || '/logo.png';
                  const itemCount = items.filter(it => it.kind === product.code).length;

                  return (
                    <button
                      key={product._id}
                      className="relative group cursor-pointer overflow-hidden rounded-lg bg-black/40 border border-zinc-800 hover:border-amber-500/70 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col h-full hover:-translate-y-1"
                      onClick={() => !pedidosCerrados && add(product.code)}
                      disabled={pedidosCerrados}
                      type="button"
                    >
                      {/* Imagen compacta */}
                      <div className="relative h-24 md:h-28 w-full bg-gradient-to-br from-zinc-800 to-black overflow-hidden flex-shrink-0">
                        <Image
                          src={imageSrc}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-125 transition-transform duration-300"
                        />
                        
                        {/* Badge solo tienda */}
                        {product.showOnlyInStore && (
                          <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded-full bg-orange-600/90 text-[8px] md:text-[10px] font-semibold text-white backdrop-blur-sm">
                            🏪
                          </div>
                        )}

                        {/* Indicador de cantidad */}
                        {itemCount > 0 && (
                          <div className="absolute bottom-1 left-1 inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-600 text-white text-[11px] font-bold">
                            {itemCount}
                          </div>
                        )}
                      </div>

                      {/* Contenido compacto */}
                      <div className="p-2 space-y-1 flex flex-col flex-1">
                        <h3 className="font-bold text-xs md:text-sm text-white line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-[10px] text-zinc-400 line-clamp-1">
                          {product.description || t.home.story.features.wood}
                        </p>

                        <div className="mt-auto pt-1 border-t border-zinc-700">
                          <span className="text-sm md:text-base font-bold text-amber-400">
                            ${product.price}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {availableProducts.length === 0 && (
                <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-8 text-center">
                  <p className="text-sm text-zinc-400">{t.order.ui.noProductsAvailable}</p>
                </div>
              )}

              {inventory && noPollo && noCostillarNormal && noCostillarGrande && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-center">
                  <p className="text-sm text-red-300 font-medium">{t.order.ui.noStockToday}</p>
                </div>
              )}
            </>
          )}
        </section>

        {/* Carrito */}
        <section className="space-y-4">
          <header className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-2xl font-bold">{t.order.yourOrder}</h2>
              <p className="text-sm text-zinc-400 mt-1">
                {hasItems
                  ? `${items.length} ${t.order.ui.cartProductsCount}`
                  : t.order.ui.cartEmptyShort}
              </p>
            </div>
            {hasItems && (
              <div className="text-right">
                <div className="text-2xl font-bold text-amber-400">${total}</div>
                <span className="text-xs text-zinc-500">{t.order.ui.totalLabel}</span>
              </div>
            )}
          </header>

          {hasItems ? (
            <div className="space-y-3 bg-black/20 rounded-xl border border-zinc-800 overflow-hidden">
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
                    className="border-b border-zinc-700 last:border-none p-4 space-y-3 hover:bg-white/5 transition"
                  >
                    {/* Header del item */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-white flex items-center gap-2">
                          {product.name}
                          <span className="text-xs bg-amber-600/30 text-amber-200 px-2 py-0.5 rounded-full font-normal">
                            ×{it.qty}
                          </span>
                        </h4>
                        
                        {/* Detalles */}
                        {(isChicken || isRib) && (it.flavor || styleName) && (
                          <p className="text-xs text-zinc-400 mt-1">
                            {styleName && isChicken && (
                              <>
                                <span className="text-zinc-300 font-medium">{styleName}</span>
                                {it.flavor && <span> • {it.flavor}</span>}
                              </>
                            )}
                            {!isChicken && it.flavor && (
                              <span className="text-zinc-300 font-medium">{it.flavor}</span>
                            )}
                          </p>
                        )}
                      </div>

                      <div className="text-right flex flex-col items-end gap-1">
                        <div className="font-bold text-lg text-amber-400">${linePrice}</div>
                        <button
                          className="text-xs px-2 py-1 rounded text-red-400 hover:bg-red-600/20 transition"
                          onClick={() => setItems((s) => s.filter((_, i) => i !== idx))}
                          title={t.order.ui.remove}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Controles */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-700">
                      {/* Sabor */}
                      {(isChicken || isRib) && availableFlavors.length > 0 && (
                        <div className="flex-1 min-w-[150px]">
                          <label className="text-[10px] text-zinc-500 uppercase tracking-wider">
                            {isChicken && isAsado
                              ? t.order.ui.flavorAsadoOnly
                              : t.order.ui.flavorLabel}
                          </label>
                          <select
                            className="w-full mt-1 px-2 py-1.5 rounded-lg bg-zinc-800 text-xs text-white border border-zinc-700 hover:border-amber-500/50 transition disabled:opacity-50"
                            disabled={isChicken && !isAsado}
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
                                {f.name} {f.price > 0 ? `+$${f.price}` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Preparación (pollos) */}
                      {isChicken && availableStyles.length > 0 && (
                        <div className="flex-1 min-w-[150px]">
                          <label className="text-[10px] text-zinc-500 uppercase tracking-wider">{t.order.ui.preparationLabel}</label>
                          <select
                            className="w-full mt-1 px-2 py-1.5 rounded-lg bg-zinc-800 text-xs text-white border border-zinc-700 hover:border-amber-500/50 transition"
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

                      {/* Cantidad */}
                      <div className="flex-1 min-w-[140px]">
                        <label className="text-[10px] text-zinc-500 uppercase tracking-wider">{t.order.ui.quantityLabel}</label>
                        <div className="mt-1 flex items-center gap-2 bg-zinc-800 rounded-lg border border-zinc-700">
                          <button
                            className="px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white transition"
                            onClick={() =>
                              setItems((s) =>
                                s.map((x, i) =>
                                  i === idx ? { ...x, qty: Math.max(1, x.qty - 1) } : x
                                )
                              )
                            }
                          >
                            −
                          </button>
                          <span className="flex-1 text-center text-xs font-semibold">{it.qty}</span>
                          <button
                            className="px-3 py-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition"
                            onClick={() => incrementItem(idx)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Resumen de detalles */}
              <div className="p-4 bg-white/5 border-t border-zinc-700 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">{t.order.subtotal}</span>
                  <span className="text-white font-medium">
                    ${items.reduce((sum, it) => {
                      const p = getProductByCode(it.kind);
                      if (!p) return sum;
                      let price = p.price;
                      if (it.flavorId) {
                        const f = getFlavorById(it.flavorId);
                        if (f) price += f.price;
                      }
                      return sum + price * it.qty;
                    }, 0)}
                  </span>
                </div>
                
                {delivery && deliveryOk && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">{t.order.shipping}</span>
                    <span className="text-emerald-400 font-medium">+$20</span>
                  </div>
                )}

                {tortillas > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">{t.order.tortillas} ({tortillas} {t.order.ui.tortillasPackShort})</span>
                    <span className="text-white font-medium">${tortillas * 10}</span>
                  </div>
                )}

                <div className="flex justify-between text-base font-bold pt-2 border-t border-zinc-700">
                  <span>{t.order.total}</span>
                  <span className="text-amber-400">${total}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-zinc-700 py-8 px-4 text-center">
              <div className="text-3xl mb-2">🛒</div>
              <p className="text-sm text-zinc-400 font-medium">{t.order.emptyCart}</p>
              <p className="text-xs text-zinc-500 mt-1">
                {t.order.emptyCartDesc}
              </p>
            </div>
          )}
        </section>

        {/* Opciones */}
        <section className="grid md:grid-cols-2 gap-4">
          {/* Entrega a domicilio */}
          <div
            className={`rounded-xl border-2 overflow-hidden transition-all group ${
              delivery
                ? deliveryOk
                  ? 'border-emerald-500/60 bg-gradient-to-br from-emerald-900/20 via-zinc-900/50 to-black/80 hover:border-emerald-500/80'
                  : 'border-red-500/60 bg-gradient-to-br from-red-900/20 via-zinc-900/50 to-black/80 hover:border-red-500/80'
                : 'border-amber-500/20 bg-gradient-to-br from-amber-900/10 via-zinc-900/50 to-black/80 hover:border-amber-500/40'
            }`}
          >
            <div className="p-4 md:p-5 space-y-4 h-full flex flex-col">
              {/* Header con switch */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-bold text-lg md:text-xl text-white flex items-center gap-2">
                    {t.order.ui.deliveryTitle}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    {delivery ? t.order.ui.deliveryActive : t.order.ui.pickupActive}
                  </p>
                </div>
                <DeliverySwitch
                  checked={delivery}
                  onChange={setDelivery}
                  tone={delivery && !deliveryOk ? 'error' : 'ok'}
                />
              </div>

              {/* Ícono y descripción */}
              <div className="flex-1 flex items-center justify-center py-2">
                <div className="text-center space-y-2">
                  <div className="text-5xl md:text-6xl opacity-80 group-hover:opacity-100 transition-opacity">
                    {delivery ? '🚗' : '🛍️'}
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed px-2">
                    {delivery 
                      ? t.order.ui.deliveryFast
                      : t.order.ui.pickupLocal}
                  </p>
                </div>
              </div>

              {/* Mensaje o estado */}
              {msg && (
                <div className="text-xs rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-200 px-3 py-2.5 space-y-1">
                  <p className="font-semibold">{t.order.ui.deliveryRequirementTitle}</p>
                  <p>{msg}</p>
                </div>
              )}

              {delivery && deliveryOk && (
                <div className="text-xs rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 px-3 py-2.5 font-medium">
                  {t.order.ui.deliveryMinimumOk}
                </div>
              )}
            </div>
          </div>

          {/* Tortillas */}
          <div className="rounded-xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-900/20 via-zinc-900/50 to-black/80 overflow-hidden hover:border-amber-500/50 transition-all group p-4 md:p-5">
            <div className="space-y-3 h-full flex flex-col">
              {/* Header */}
              <div className="flex items-start gap-3 flex-1">
                {/* Imagen pequeña en móvil, mediana en desktop */}
                <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-gradient-to-br from-amber-200/10 to-transparent border border-amber-500/40 shadow-md shadow-amber-500/10 flex-shrink-0 group-hover:shadow-amber-500/20 transition-shadow">
                  <Image
                    src="/menu/tortillas.png"
                    alt="Tortillas"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>

                {/* Contenido texto */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base md:text-lg text-white">{t.order.ui.tortillasTitle}</h3>
                  <p className="text-xs text-amber-200/70 mt-1">{t.order.ui.tortillasSubtitle}</p>
                  
                  {/* Precio */}
                  <div className="mt-2 space-y-0.5">
                    <p className="text-xl md:text-2xl font-bold text-amber-400">$10</p>
                    <p className="text-[10px] text-zinc-400">{t.order.ui.perPack}</p>
                  </div>
                </div>
              </div>

              {/* Controles */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-amber-500/20">
                <div className="flex items-center gap-1.5">
                  <button
                    className="h-9 w-9 rounded-lg bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 text-red-400 hover:text-red-300 font-bold text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={() => setTortillas(Math.max(0, tortillas - 1))}
                    disabled={tortillas === 0}
                    title={t.order.ui.removeTortillas}
                  >
                    −
                  </button>

                  <div className="flex flex-col items-center gap-0.5 px-2">
                    <span className="text-lg font-bold text-white">{tortillas}</span>
                    <span className="text-[9px] text-zinc-500 uppercase tracking-wider">{t.order.ui.tortillasPackShort}</span>
                  </div>
                </div>

                <button
                  className="flex-1 h-9 px-3 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 border border-amber-400/50 text-white font-semibold text-sm transition-all hover:shadow-lg hover:shadow-amber-500/30 active:scale-95"
                  onClick={() => {
                    showDialog({
                      title: t.order.dialogs.addTortillasTitle,
                      message: t.order.dialogs.addTortillasMsg,
                      tone: 'info',
                      onClose: () => {
                        setTortillas(tortillas + 1);
                      },
                    });
                  }}
                  title={t.order.ui.addTortillasButton}
                >
                  {t.order.ui.addTortillas}
                </button>
              </div>

              {/* Resumen economía */}
              {tortillas > 0 && (
                <div className="mt-2 p-2 rounded-lg bg-black/50 border border-amber-500/20">
                  <p className="text-xs text-amber-200">
                    {t.order.tortillas}: <span className="font-bold">${tortillas * 10}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Datos cliente */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold">{t.order.orderInfo}</h2>

          {formErrors.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 space-y-1">
              {formErrors.map((e, i) => (
                <p key={i} className="text-xs text-red-300">• {e}</p>
              ))}
            </div>
          )}

          {showCustomerForms ? (
            <>
              {/* Datos básicos */}
              <div className="space-y-2.5 bg-black/40 rounded-xl border border-zinc-800 p-4">
                <h3 className="text-sm font-semibold text-zinc-200">{t.order.yourInfo}</h3>
                
                <div className="grid sm:grid-cols-2 gap-2.5">
                  <input
                    className="input h-10 text-sm bg-zinc-800 border-zinc-700"
                    placeholder={t.order.fullName}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <input
                    className="input h-10 text-sm bg-zinc-800 border-zinc-700"
                    placeholder={t.order.phone}
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <select
                  className="input h-10 w-full text-sm bg-zinc-800 border-zinc-700"
                  value={desiredAt}
                  onChange={(e) => setDesiredAt(e.target.value)}
                  suppressHydrationWarning
                >
                  <option value="" disabled>
                    {pedidosCerrados ? t.order.ui.closedScheduleShort : t.order.desiredTime}
                  </option>
                  {slots.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sección de ubicación si es delivery */}
              {delivery && (
                <div className="space-y-2.5 bg-black/40 rounded-xl border border-zinc-800 p-4">
                  <h3 className="text-sm font-semibold text-zinc-200">{t.order.deliveryLocation}</h3>
                  
                  {gettingLocation && (
                    <div className="space-y-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin">📍</div>
                        <span className="text-xs text-amber-200 font-medium">{t.order.ui.obtainingLocation}</span>
                      </div>
                      <div className="w-full bg-black/50 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                      </div>
                      <p className="text-[10px] text-amber-200/70">{t.order.ui.obtainingLocationHint}</p>
                    </div>
                  )}

                  {!gettingLocation && (
                    <div className="flex gap-2">
                      <button 
                        className="flex-1 btn h-10 text-sm bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={getLocation}
                        disabled={gettingLocation}
                      >
                        {t.order.ui.myLocationBtn}
                      </button>
                      {geo && (
                        <button 
                          className="flex-1 btn h-10 text-sm bg-zinc-700 hover:bg-zinc-600"
                          onClick={() => setShowMap(true)}
                        >
                          {t.order.ui.adjustMapBtn}
                        </button>
                      )}
                    </div>
                  )}

                  {geo && (
                    <div className="space-y-1">
                      <p className="text-xs text-emerald-300 font-medium">
                        {t.order.ui.locationObtainedShort}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        {t.order.ui.coords}: ({geo.lat.toFixed(4)}, {geo.lng.toFixed(4)})
                        {gpsAccuracy && gpsAccuracy < 3000 && (
                          <span className="text-emerald-300 ml-2">{t.order.ui.precision}: ±{gpsAccuracy}m</span>
                        )}
                      </p>
                    </div>
                  )}
                  <textarea
                    className="input w-full text-sm bg-zinc-800 border-zinc-700 min-h-[80px]"
                    placeholder={t.order.address}
                    value={addressNote}
                    onChange={(e) => setAddressNote(e.target.value)}
                  />

                  {gpsAccuracy != null && gpsAccuracy < 3000 && (
                    <p className="text-[11px] text-zinc-500">
                      {t.order.ui.precision} GPS: ±{gpsAccuracy}m
                    </p>
                  )}
                </div>
              )}

              {/* Pick up */}
              {!delivery && (
                <div className="bg-black/40 rounded-xl border border-zinc-800 p-4">
                  <p className="text-sm text-zinc-300">
                    {t.order.ui.pickupAt} <span className="font-semibold">Ignacio Manuel Altamirano 216</span>
                  </p>
                  <p className="text-xs text-zinc-400 mt-2">
                    Centro, Puruándiro, Michoacán 58500
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-black/40 rounded-xl border border-dashed border-zinc-700 p-6 text-center">
              <p className="text-sm text-zinc-400">{t.order.ui.addProductsToContinue}</p>
            </div>
          )}
        </section>
          </div>

          {/* Columna derecha: Resumen (1/3 en desktop) */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              {/* Resumen del pedido */}
              <div className="rounded-xl border border-zinc-800 bg-black/50 overflow-hidden">
                {/* Header */}
                <div className="p-3 md:p-4 bg-gradient-to-r from-amber-600/20 to-amber-500/10 border-b border-zinc-800">
                  <h3 className="font-bold text-sm md:text-base text-white">{t.order.ui.summaryTitle}</h3>
                </div>

                {/* Items */}
                <div className="divide-y divide-zinc-800 max-h-96 overflow-y-auto">
                  {items.length === 0 ? (
                    <div className="p-4 text-center text-xs text-zinc-500">
                      {t.order.ui.noProductsYet}
                    </div>
                  ) : (
                    items.map((it, idx) => {
                      const p = getProductByCode(it.kind);
                      if (!p) return null;
                      let price = p.price;
                      if (it.flavorId) {
                        const f = getFlavorById(it.flavorId);
                        if (f) price += f.price;
                      }
                      return (
                        <div
                          key={`${it.productId ?? it.kind}-${it.flavorId ?? 'na'}-${it.styleId ?? 'na'}-${it.qty}`}
                          className="p-3 text-xs space-y-1"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white truncate">{p.name}</p>
                              {it.flavor && <p className="text-zinc-400 truncate">{it.flavor}</p>}
                            </div>
                            <span className="font-bold text-amber-400 flex-shrink-0">×{it.qty}</span>
                          </div>
                          <div className="text-right text-amber-400 font-semibold">
                            ${price * it.qty}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Totals */}
                {hasItems && (
                  <div className="p-3 md:p-4 bg-black/80 border-t border-zinc-800 space-y-2">
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>{t.order.subtotal}</span>
                      <span>${items.reduce((sum, it) => {
                        const p = getProductByCode(it.kind);
                        if (!p) return sum;
                        let price = p.price;
                        if (it.flavorId) {
                          const f = getFlavorById(it.flavorId);
                          if (f) price += f.price;
                        }
                        return sum + price * it.qty;
                      }, 0)}</span>
                    </div>

                    {delivery && deliveryOk && (
                      <div className="flex justify-between text-xs text-zinc-400">
                        <span>{t.order.ui.shippingShort}</span>
                        <span className="text-emerald-400">+$20</span>
                      </div>
                    )}

                    {tortillas > 0 && (
                      <div className="flex justify-between text-xs text-zinc-400">
                        <span>{t.order.tortillas} ({tortillas})</span>
                        <span>${tortillas * 10}</span>
                      </div>
                    )}

                    <div className="border-t border-zinc-700 pt-2 flex justify-between font-bold text-sm">
                      <span className="text-white">{t.order.total}</span>
                      <span className="text-amber-400">${total}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Botón confirmar */}
              {hasItems && showCustomerForms && (
                <button
                  className="w-full py-3 md:py-4 rounded-xl font-bold text-sm md:text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white hover:shadow-lg hover:shadow-amber-500/30"
                  onClick={() => submit(delivery ? 'delivery' : 'pickup')}
                  disabled={pedidosCerrados}
                >
                  {delivery ? t.order.confirmDelivery : t.order.confirmPickup}
                </button>
              )}

              {pedidosCerrados && (
                <p className="text-xs text-zinc-400 text-center py-2">
                  {t.order.ui.closedScheduleShort}
                </p>
              )}

              {!hasItems && (
                <p className="text-xs text-zinc-400 text-center py-4">
                  {t.order.ui.addProductsForSummary}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Mapa para Pick Up - full width en móvil */}
        {!delivery && hasItems && (
          <section className="space-y-3">
            <div className="bg-black/40 rounded-xl border border-zinc-800 overflow-hidden">
              <div className="h-80 rounded-t-xl overflow-hidden border-b border-zinc-800">
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
              <div className="p-4 space-y-2">
                <h3 className="font-bold text-sm text-white">{t.order.ui.pickupHere}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{BUSINESS_ADDR}</p>
                <p className="text-[10px] text-zinc-500 pt-1">{t.order.ui.openInMaps}</p>
              </div>
            </div>
          </section>
        )}

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
                {t.order.understood}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
