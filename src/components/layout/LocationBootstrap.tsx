"use client";

import { useEffect, useState } from "react";
import { useSimulationStore } from "@/lib/store/simulationStore";
import { MapPin, Navigation, X, ExternalLink, Locate } from "lucide-react";

export function LocationBootstrap() {
  const { locationPermission, setUserLocation, setLocationPermission } = useSimulationStore();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeniedHelp, setShowDeniedHelp] = useState(false);

  // On mount: check existing permission state
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationPermission("denied");
      return;
    }
    if (!navigator.permissions) {
      // Older browsers — show modal to trigger native prompt
      setShowModal(true);
      return;
    }
    navigator.permissions.query({ name: "geolocation" }).then((result) => {
      if (result.state === "granted") {
        // Already granted — silently fetch
        setLocationPermission("requesting");
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setLocationPermission("granted");
          },
          () => setLocationPermission("denied"),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else if (result.state === "prompt") {
        // Show our UI first before triggering native prompt
        setShowModal(true);
      } else {
        setLocationPermission("denied");
      }

      // Watch for permission changes (e.g., user unlocks in browser settings)
      result.onchange = () => {
        if (result.state === "granted") {
          setShowModal(false);
          setShowDeniedHelp(false);
          requestLocation();
        } else if (result.state === "denied") {
          setLocationPermission("denied");
        }
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function requestLocation() {
    setLoading(true);
    setLocationPermission("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationPermission("granted");
        setShowModal(false);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        if (err.code === 1) {
          setLocationPermission("denied");
          setShowDeniedHelp(true);
        } else {
          setLocationPermission("denied");
        }
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  function handleAllow() {
    requestLocation();
  }

  function handleSkip() {
    setShowModal(false);
    setLocationPermission("denied");
  }

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-sm rounded-2xl border border-[#1e2d4a] bg-[#0d1526] shadow-2xl overflow-hidden">

        {/* Decorative top bar */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-blue-400 to-emerald-400" />

        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-600 hover:bg-white/10 hover:text-slate-400 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-8 py-8">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20">
                <MapPin className="h-9 w-9 text-blue-400" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
                🏥
              </span>
            </div>
          </div>

          {/* Text */}
          <div className="mb-6 text-center">
            <h2 className="text-base font-bold text-white mb-2">Enable Location Access</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Hydra uses your location to instantly recommend the{" "}
              <span className="text-blue-300 font-medium">nearest available hospital</span> with
              the right resources for each patient's condition.
            </p>
          </div>

          {/* Feature bullets */}
          <div className="mb-6 space-y-2.5">
            {[
              { icon: "📍", text: "See real-time distance to each hospital" },
              { icon: "🏥", text: "Ranked by match quality + proximity" },
              { icon: "⚡", text: "Faster critical care routing decisions" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-xs text-slate-400">
                <span className="text-base">{icon}</span>
                {text}
              </div>
            ))}
          </div>

          {!showDeniedHelp ? (
            <>
              {/* Allow button */}
              <button
                onClick={handleAllow}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500 active:scale-[.98] transition-all disabled:opacity-60 mb-3"
              >
                {loading ? (
                  <>
                    <Locate className="h-4 w-4 animate-spin" />
                    Detecting your location…
                  </>
                ) : (
                  <>
                    <Navigation className="h-4 w-4" />
                    Allow Location Access
                  </>
                )}
              </button>

              <button
                onClick={handleSkip}
                className="w-full text-center text-xs text-slate-600 hover:text-slate-400 transition-colors py-1"
              >
                Skip for now — I'll search manually
              </button>
            </>
          ) : (
            /* Denied help state */
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="text-xs font-semibold text-amber-400 mb-2">Location permission blocked</p>
              <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                Your browser has blocked location access. To enable it:
              </p>
              <ol className="text-[11px] text-slate-500 space-y-1.5 mb-4">
                <li className="flex gap-2"><span className="text-amber-400 font-bold shrink-0">1.</span> Click the lock/info icon in your browser's address bar</li>
                <li className="flex gap-2"><span className="text-amber-400 font-bold shrink-0">2.</span> Find "Location" and set it to "Allow"</li>
                <li className="flex gap-2"><span className="text-amber-400 font-bold shrink-0">3.</span> Reload the page</li>
              </ol>
              <button
                onClick={handleSkip}
                className="w-full rounded-lg border border-[#1e2d4a] bg-[#111b2e] py-2 text-xs text-slate-400 hover:bg-white/5 transition-colors"
              >
                Continue without location
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
