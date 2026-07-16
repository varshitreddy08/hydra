"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  X,
  Building2,
  MapPin,
  Loader2,
  Navigation,
  Phone,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useSimulationStore } from "@/lib/store/simulationStore";

const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#080c18]">
      <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
    </div>
  ),
});

interface AddHospitalDialogProps {
  open: boolean;
  onClose: () => void;
}

interface LatLng {
  lat: number;
  lng: number;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { "Accept-Language": "en", "User-Agent": "HydraHospital/1.0" } }
    );
    const data = await res.json();
    if (data.display_name) {
      // Build a concise readable address from components
      const a = data.address ?? {};
      const parts = [
        a.house_number && a.road ? `${a.house_number} ${a.road}` : a.road,
        a.suburb ?? a.neighbourhood ?? a.quarter,
        a.city ?? a.town ?? a.village ?? a.municipality,
        a.state,
        a.country,
      ].filter(Boolean);
      return parts.slice(0, 4).join(", ");
    }
  } catch {
    // silent
  }
  return "";
}

async function forwardGeocode(address: string): Promise<LatLng | null> {
  try {
    const params = new URLSearchParams({ format: "json", q: address, limit: "1" });
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { "Accept-Language": "en", "User-Agent": "HydraHospital/1.0" },
    });
    const data = await res.json();
    if (data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    // silent
  }
  return null;
}

type LocState = "idle" | "requesting" | "success" | "denied" | "error";

export function AddHospitalDialog({ open, onClose }: AddHospitalDialogProps) {
  const { addHospital } = useSimulationStore();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pin, setPin] = useState<LatLng | null>(null);
  const [locState, setLocState] = useState<LocState>("idle");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  // ── Dragged pin → reverse geocode new address ────────────────────────────
  // Must be declared before any early return to obey Rules of Hooks
  const handlePinMove = useCallback(async (lat: number, lng: number) => {
    setPin({ lat, lng });
    const addr = await reverseGeocode(lat, lng);
    if (addr) setAddress(addr);
  }, []);

  if (!open) return null;

  // ── GPS auto-locate ──────────────────────────────────────────────────────
  async function handleDetectLocation() {
    if (!navigator.geolocation) {
      setLocState("error");
      return;
    }
    setLocState("requesting");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPin(coords);
        setLocState("success");
        // Auto-fill address via reverse geocoding
        const addr = await reverseGeocode(coords.lat, coords.lng);
        if (addr) setAddress(addr);
      },
      (err) => {
        setLocState(err.code === 1 ? "denied" : "error");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // ── Search address → geocode → move pin ─────────────────────────────────
  async function handleSearchAddress() {
    if (!address.trim()) return;
    setSearchLoading(true);
    setSearchError("");
    const result = await forwardGeocode(address.trim());
    setSearchLoading(false);
    if (result) {
      setPin(result);
      setLocState("success");
    } else {
      setSearchError("Address not found — try a more specific location.");
    }
  }

  function handleClose() {
    setName(""); setPhone(""); setAddress(""); setPin(null);
    setLocState("idle"); setSearchError("");
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addHospital({ name: name.trim(), address: address.trim(), phone: phone.trim(), ...(pin ?? {}) });
    handleClose();
  }

  const locMessages: Record<LocState, { text: string; cls: string; icon: React.ReactNode } | null> = {
    idle: null,
    requesting: { text: "Accessing GPS…", cls: "text-blue-400", icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
    success: { text: "Location captured", cls: "text-emerald-400", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    denied: { text: "Location permission denied — type an address instead.", cls: "text-amber-400", icon: <AlertCircle className="h-3.5 w-3.5" /> },
    error: { text: "GPS unavailable — type an address below.", cls: "text-amber-400", icon: <AlertCircle className="h-3.5 w-3.5" /> },
  };

  const msg = locMessages[locState];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-2xl border border-[#1e2d4a] bg-[#0d1526] shadow-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-[#1e2d4a] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 border border-blue-500/20">
              <Building2 className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Add Hospital</h2>
              <p className="text-[11px] text-slate-500">Set location to enable distance-based routing</p>
            </div>
          </div>
          <button onClick={handleClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-white/10 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5">

            {/* ── Detect location CTA ── */}
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-white mb-0.5">Use Current Location</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Click to auto-detect your GPS position. The address will be filled in automatically
                    and a pin will appear on the map below.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={locState === "requesting"}
                  className="shrink-0 flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 active:scale-95 transition-all disabled:opacity-60"
                >
                  {locState === "requesting"
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Navigation className="h-3.5 w-3.5" />}
                  {locState === "requesting" ? "Locating…" : "Detect Location"}
                </button>
              </div>
              {msg && (
                <div className={`mt-3 flex items-center gap-2 text-[11px] font-medium ${msg.cls}`}>
                  {msg.icon}
                  {msg.text}
                </div>
              )}
            </div>

            {/* ── Map preview ── */}
            <div className="overflow-hidden rounded-xl border border-[#1e2d4a]" style={{ height: 220 }}>
              {pin ? (
                <LocationPickerMap lat={pin.lat} lng={pin.lng} onMove={handlePinMove} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 bg-[#080c18]">
                  <MapPin className="h-8 w-8 text-slate-700" />
                  <p className="text-xs text-slate-600">Map preview appears here after location is set</p>
                  <p className="text-[10px] text-slate-700">You can drag the pin to fine-tune position</p>
                </div>
              )}
            </div>

            {/* ── Address ── */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                Address
                {pin && <span className="ml-2 text-[10px] text-slate-600">(auto-filled · editable)</span>}
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    value={address}
                    onChange={(e) => { setAddress(e.target.value); setSearchError(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSearchAddress(); } }}
                    placeholder="Type address or use Detect Location above"
                    className="w-full rounded-lg border border-[#1e2d4a] bg-[#111b2e] pl-9 pr-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSearchAddress}
                  disabled={!address.trim() || searchLoading}
                  className="flex items-center gap-1.5 rounded-lg border border-[#1e2d4a] bg-[#111b2e] px-3 py-2 text-xs text-slate-400 hover:border-blue-500/40 hover:text-blue-400 transition-colors disabled:opacity-40"
                >
                  {searchLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Search"}
                </button>
              </div>
              {searchError && (
                <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-amber-400">
                  <AlertCircle className="h-3 w-3" /> {searchError}
                </p>
              )}
              {pin && (
                <p className="mt-1.5 text-[10px] text-slate-600">
                  Coordinates: {pin.lat.toFixed(6)}, {pin.lng.toFixed(6)}
                </p>
              )}
            </div>

            {/* ── Name + Phone ── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Hospital Name <span className="text-red-400">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. St. Mary's Medical Center"
                  required
                  className="w-full rounded-lg border border-[#1e2d4a] bg-[#111b2e] px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 (555) 200-3000"
                    className="w-full rounded-lg border border-[#1e2d4a] bg-[#111b2e] pl-9 pr-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* ── Footer ── */}
          <div className="flex gap-3 border-t border-[#1e2d4a] px-6 py-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-lg border border-[#1e2d4a] bg-transparent py-2 text-sm text-slate-400 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-500 active:scale-[.98] transition-all disabled:opacity-40"
            >
              Add Hospital
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
