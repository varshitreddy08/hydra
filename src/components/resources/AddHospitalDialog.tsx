"use client";

import { useState } from "react";
import { X, Building2, MapPin, Loader2, Navigation, Phone, CheckCircle2, AlertCircle } from "lucide-react";
import { useSimulationStore } from "@/lib/store/simulationStore";

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
  const { addHospital, setUserLocation, setLocationPermission } = useSimulationStore();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [locState, setLocState] = useState<LocState>("idle");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  if (!open) return null;

  async function handleDetectLocation() {
    if (!navigator.geolocation) { setLocState("error"); return; }
    setLocState("requesting");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const c: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        // Update global store so the rest of the app benefits too
        setUserLocation(c);
        setLocationPermission("granted");
        setCoords(c);
        const addr = await reverseGeocode(c.lat, c.lng);
        if (addr) setAddress(addr);
        setLocState("success");
      },
      (err) => setLocState(err.code === 1 ? "denied" : "error"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSearchAddress() {
    if (!address.trim()) return;
    setSearchLoading(true);
    setSearchError("");
    const result = await forwardGeocode(address.trim());
    setSearchLoading(false);
    if (result) {
      setCoords(result);
      setLocState("success");
    } else {
      setSearchError("Address not found — try a more specific location.");
    }
  }

  function handleClose() {
    setName(""); setPhone(""); setAddress(""); setCoords(null);
    setLocState("idle"); setSearchError("");
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addHospital({
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
      ...(coords ?? {}),
    });
    handleClose();
  }

  const locMessages: Record<LocState, { text: string; cls: string; icon: React.ReactNode } | null> = {
    idle: null,
    requesting: { text: "Detecting location…", cls: "text-blue-400", icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
    success: { text: "Location captured", cls: "text-emerald-400", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    denied: { text: "Location Permission denied — type the address manually.", cls: "text-amber-400", icon: <AlertCircle className="h-3.5 w-3.5" /> },
    error: { text: "GPS unavailable — type the address below.", cls: "text-amber-400", icon: <AlertCircle className="h-3.5 w-3.5" /> },
  };

  const msg = locMessages[locState];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-[#1e2d4a] bg-[#0d1526] shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#1e2d4a] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 border border-blue-500/20">
              <Building2 className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Add Hospital</h2>
              <p className="text-[11px] text-slate-500">Fill in the details below</p>
            </div>
          </div>
          <button onClick={handleClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-white/10 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

            {/* Hospital Name */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                Hospital Name <span className="text-red-400">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. St. Mary's Medical Center"
                required
                autoFocus
                className="w-full rounded-lg border border-[#1e2d4a] bg-[#111b2e] px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full rounded-lg border border-[#1e2d4a] bg-[#111b2e] pl-9 pr-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Address</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    value={address}
                    onChange={(e) => { setAddress(e.target.value); setSearchError(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSearchAddress(); } }}
                    placeholder="Type address and press Search"
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
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={locState === "requesting"}
                  title="Use current Location Permission"
                  className="shrink-0 flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500 active:scale-95 transition-all disabled:opacity-60"
                >
                  {locState === "requesting"
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Navigation className="h-3.5 w-3.5" />}
                  {locState === "requesting" ? "…" : "Locate"}
                </button>
              </div>

              {msg && (
                <p className={`mt-1.5 flex items-center gap-1.5 text-[11px] font-medium ${msg.cls}`}>
                  {msg.icon} {msg.text}
                </p>
              )}
              {searchError && (
                <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-amber-400">
                  <AlertCircle className="h-3 w-3" /> {searchError}
                </p>
              )}
              {coords && (
                <p className="mt-1 text-[10px] text-slate-600">
                  {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                </p>
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="flex shrink-0 gap-3 border-t border-[#1e2d4a] px-6 py-4">
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
