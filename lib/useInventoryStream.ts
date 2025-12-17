// lib/useInventoryStream.ts
'use client';

import { useEffect, useState, useCallback } from 'react';

export type InventorySnapshot = {
  pollo: number;
  costillar_normal: number;
  costillar_grande: number;
};

type InventoryStreamEvent = {
  type: 'inventory_update';
  data: InventorySnapshot;
  timestamp: number;
};

/**
 * Hook que se suscribe al stream de inventario en tiempo real
 * Actualiza automáticamente cuando el inventario cambia en el servidor
 */
export function useInventoryStream() {
  const [inventory, setInventory] = useState<InventorySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      try {
        es = new EventSource('/api/inventory/stream');

        es.addEventListener('message', (event) => {
          try {
            const msg = JSON.parse(event.data || '{}') as InventoryStreamEvent;
            if (msg.type === 'inventory_update') {
              setInventory(msg.data);
              setError(null);
              setLoading(false);
              reconnectAttempts = 0; // Reset on successful message
            }
          } catch (e) {
            console.error('Error parsing inventory message:', e);
          }
        });

        es.addEventListener('error', () => {
          console.error('EventSource error');
          es?.close();
          es = null;
          setError('Conexión perdida con el servidor');

          // Reintentar conexión con backoff exponencial
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            reconnectTimeout = setTimeout(() => {
              reconnectAttempts++;
              connect();
            }, delay);
          } else {
            setError('No se puede conectar al servidor. Por favor recarga la página.');
          }
        });

        // Ping inicial para verificar conexión
        es.addEventListener('ping', () => {
          // Latido del servidor, ignorar
        });
      } catch (err) {
        console.error('Error creating EventSource:', err);
        setError('Error al conectar con el servidor');
        setLoading(false);
      }
    };

    connect();

    return () => {
      if (es) {
        es.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  return { inventory, loading, error };
}
