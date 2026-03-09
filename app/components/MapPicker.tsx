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
    const [loading, setLoading] = useState(false);
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
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-3">
        <div className="bg-zinc-900 w-full md:w-[min(100%,700px)] h-[min(100vh,85vh)] md:h-[min(85vh,600px)] rounded-t-2xl md:rounded-2xl overflow-hidden shadow-xl grid grid-rows-[auto,1fr,auto]">
          <div className="p-4 border-b border-zinc-800 font-semibold text-sm md:text-base flex items-center justify-between">
            <span>Ajusta tu ubicación</span>
            <button 
              className="md:hidden text-xl leading-none text-zinc-400 hover:text-white transition"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          <div className="relative">
            <MapInner pos={pos} onMoveMarker={(ll) => setPos(ll)} />
          </div>

          <div className="p-3 md:p-4 border-t border-zinc-800 flex gap-2 justify-end">
            <button 
              className="btn px-4 py-2 md:px-6 md:py-3 text-sm md:text-base" 
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              className="btn bg-brand hover:bg-brand/90 disabled:opacity-50 px-4 py-2 md:px-6 md:py-3 text-sm md:text-base"
              disabled={!pos || loading}
              onClick={async () => {
                if (!pos) return;
                setLoading(true);
                try {
                  const addr = await resolveAddress(pos);
                  onChange(pos, addr);
                  onClose();
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? 'Obteniendo dirección...' : 'Usar esta ubicación'}
            </button>
          </div>
        </div>
      </div>
    );
  }
