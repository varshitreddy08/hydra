"use client";

import { useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const PIN_ICON = L.divIcon({
  className: "",
  html: `
    <div style="position:relative;width:36px;height:44px">
      <div style="
        position:absolute;inset:0;
        background:linear-gradient(135deg,#3b82f6,#1d4ed8);
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 4px 16px rgba(59,130,246,0.5),0 0 0 3px rgba(59,130,246,0.2);
      "></div>
      <div style="
        position:absolute;top:8px;left:8px;
        width:20px;height:20px;
        background:white;border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        font-size:10px;
      ">🏥</div>
    </div>
  `,
  iconSize: [36, 44],
  iconAnchor: [18, 44],
  popupAnchor: [0, -46],
});

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 15, { duration: 1.2 });
  }, [map, lat, lng]);
  return null;
}

interface LocationPickerMapProps {
  lat: number;
  lng: number;
  onMove: (lat: number, lng: number) => void;
}

export default function LocationPickerMap({ lat, lng, onMove }: LocationPickerMapProps) {
  const markerRef = useRef<L.Marker | null>(null);

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      style={{ height: "100%", width: "100%" }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />
      <Marker
        position={[lat, lng]}
        icon={PIN_ICON}
        draggable={true}
        ref={markerRef}
        eventHandlers={{
          dragend: () => {
            const pos = markerRef.current?.getLatLng();
            if (pos) onMove(pos.lat, pos.lng);
          },
        }}
      />
      <FlyTo lat={lat} lng={lng} />
    </MapContainer>
  );
}
