'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

type LatLng = { lat: number; lng: number };

// Importa el mapa completo con ssr:false (evita errores de window)
const MapInner = dynamic(() => import('./MapInner'), { ssr: false });

export default function MapPicker({
  open,
  onClose,
  value,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  value: LatLng | null;
  onChange: (ll: LatLng, displayAddress?: string) => void;
}) {
  const [pos, setPos] = useState<LatLng | null>(value);
  useEffect(() => setPos(value), [value]);

  async function resolveAddress(ll: LatLng) {
    try {
      const q = new URLSearchParams({ format: 'jsonv2', lat: String(ll.lat), lon: String(ll.lng) });
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?${q}`, {
        headers: { Accept: 'application/json' },
      });
      const j = await r.json();
      return (j?.display_name as string) || undefined;
    } catch {
      return undefined;
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60">
      <div className="bg-zinc-900 w-[min(100%,900px)] h-[min(85vh,700px)] rounded-2xl overflow-hidden shadow-xl grid grid-rows-[auto,1fr,auto]">
        <div className="p-3 border-b border-zinc-800 font-semibold">Elige tu ubicación</div>

        <div className="relative">
          <MapInner pos={pos} onMoveMarker={(ll) => setPos(ll)} />
        </div>

        <div className="p-3 border-t border-zinc-800 flex gap-2 justify-end">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button
            className="btn bg-brand hover:bg-brand/90 disabled:opacity-50"
            disabled={!pos}
            onClick={async () => {
              if (!pos) return;
              const addr = await resolveAddress(pos);
              onChange(pos, addr);
              onClose();
            }}
          >
            Usar esta ubicación
          </button>
        </div>
      </div>
    </div>
  );
}
