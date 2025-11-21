'use client';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import { useMemo } from 'react';

// (opcional) para íconos por defecto
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

type LatLng = { lat: number; lng: number };

function ClickHandler({ onClick }: { onClick: (ll: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function MapInner({
  pos,
  onMoveMarker,
}: {
  pos: LatLng | null;
  onMoveMarker: (ll: LatLng) => void;
}) {
  const center: LatLngExpression = useMemo<LatLngExpression>(
    () => (pos ? [pos.lat, pos.lng] : [20.6736, -103.344]),
    [pos]
  );

  const markerPos: LatLngExpression | null = useMemo(
    () => (pos ? [pos.lat, pos.lng] : null),
    [pos]
  );

  return (
    <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {markerPos && (
        <Marker
          position={markerPos}
          draggable
          eventHandlers={{
            dragend: (e: any) => {
              const ll = e.target.getLatLng();
              onMoveMarker({ lat: ll.lat, lng: ll.lng });
            },
          }}
        />
      )}
      <ClickHandler onClick={(ll) => onMoveMarker(ll)} />
    </MapContainer>
  );
}
