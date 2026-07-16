"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { HospitalSuggestion } from "./HospitalMapSuggestion";

// Fix default marker icon paths broken by webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function makeHospitalIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:32px;height:32px;border-radius:50% 50% 50% 0;
      background:${color};border:2px solid rgba(255,255,255,0.8);
      transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
  });
}

const ICONS = {
  full: makeHospitalIcon("#10b981"),
  partial: makeHospitalIcon("#f59e0b"),
  none: makeHospitalIcon("#ef4444"),
};

function FitBounds({ suggestions, userPos }: { suggestions: HospitalSuggestion[]; userPos: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    const pts: L.LatLngExpression[] = [];
    if (userPos) pts.push(userPos);
    suggestions.forEach((s) => {
      if (s.lat != null && s.lng != null) pts.push([s.lat, s.lng]);
    });
    if (pts.length > 1) {
      map.fitBounds(L.latLngBounds(pts), { padding: [48, 48] });
    } else if (pts.length === 1) {
      map.setView(pts[0], 13);
    }
  }, [map, suggestions, userPos]);
  return null;
}

interface HospitalMapProps {
  suggestions: HospitalSuggestion[];
  userPos: [number, number] | null;
  onSelectHospital: (id: string) => void;
  selectedId: string | null;
}

export default function HospitalMap({ suggestions, userPos, onSelectHospital, selectedId }: HospitalMapProps) {
  const center: L.LatLngExpression = userPos ?? [40.7589, -73.9851];

  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ height: "100%", width: "100%", background: "#0d1526" }}
      className="rounded-xl"
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />

      {/* User location */}
      {userPos && (
        <CircleMarker
          center={userPos}
          radius={10}
          pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.9, weight: 2 }}
        >
          <Popup>
            <div className="text-xs font-semibold">Your Location</div>
          </Popup>
        </CircleMarker>
      )}

      {/* Hospital markers */}
      {suggestions.map((s) => {
        if (s.lat == null || s.lng == null) return null;
        const icon =
          s.matchScore === 1 ? ICONS.full : s.matchScore > 0 ? ICONS.partial : ICONS.none;
        return (
          <Marker
            key={s.id}
            position={[s.lat, s.lng]}
            icon={icon}
            eventHandlers={{ click: () => onSelectHospital(s.id) }}
          >
            <Popup>
              <div style={{ minWidth: 180 }}>
                <p style={{ fontWeight: 700, marginBottom: 4, color: "#111" }}>{s.name}</p>
                <p style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>{s.address}</p>
                {s.distanceKm != null && (
                  <p style={{ fontSize: 11, color: "#2563eb" }}>{s.distanceKm.toFixed(1)} km away</p>
                )}
                <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {s.resourceMatches.map((rm) => (
                    <span
                      key={rm.type}
                      style={{
                        fontSize: 10,
                        padding: "1px 6px",
                        borderRadius: 99,
                        background: rm.available ? "#d1fae5" : "#fee2e2",
                        color: rm.available ? "#065f46" : "#991b1b",
                      }}
                    >
                      {rm.label}{rm.available ? ` ✓ (${rm.count})` : " ✗"}
                    </span>
                  ))}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      <FitBounds suggestions={suggestions} userPos={userPos} />
    </MapContainer>
  );
}
