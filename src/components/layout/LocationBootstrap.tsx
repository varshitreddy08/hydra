"use client";

import { useEffect, useState } from "react";
import { useSimulationStore } from "@/lib/store/simulationStore";
import { MapPin, X, RefreshCw, ExternalLink } from "lucide-react";

type Step = "idle" | "requesting" | "denied" | "done";

export function LocationBootstrap() {
  const { setUserLocation, setLocationPermission } = useSimulationStore();
  const [step, setStep] = useState<Step>("idle");

  function fetchCoords() {
    setStep("requesting");
    setLocationPermission("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationPermission("granted");
        setStep("done");
      },
      (err) => {
        setLocationPermission("denied");
        // Only show the modal for explicit denial (code 1); position unavailable /
        // timeout are transient and don't need user action.
        setStep(err.code === 1 ? "denied" : "done");
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationPermission("denied");
      return;
    }

    if (!navigator.permissions) {
      // Older browsers — fire immediately, no Permissions API needed
      fetchCoords();
      return;
    }

    navigator.permissions.query({ name: "geolocation" }).then((result) => {
      if (result.state === "granted") {
        // Already allowed — silently fetch, no modal ever shown
        fetchCoords();
      } else if (result.state === "prompt") {
        // First visit — fire the NATIVE browser popup immediately
        fetchCoords();
      } else {
        // "denied" — show the unlock instructions modal
        setLocationPermission("denied");
        setStep("denied");
      }

      // React to live permission changes (user clicks allow/block in browser settings)
      result.onchange = () => {
        if (result.state === "granted") {
          setStep("idle");
          fetchCoords();
        } else if (result.state === "denied") {
          setLocationPermission("denied");
          setStep("denied");
        }
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only show UI when location was explicitly denied and needs manual unlock
  if (step !== "denied") return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-sm rounded-2xl border border-[#1e2d4a] bg-[#0d1526] shadow-2xl overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-orange-400 to-red-400" />

        {/* Dismiss */}
        <button
          onClick={() => setStep("done")}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-600 hover:bg-white/10 hover:text-slate-400 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-7 py-7">
          {/* Icon */}
          <div className="mb-5 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20">
              <MapPin className="h-8 w-8 text-amber-400" />
            </div>
          </div>

          <div className="mb-5 text-center">
            <h2 className="text-base font-bold text-white mb-1.5">Location Blocked</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your browser has blocked location access for this site. Follow the steps
              below to enable it so Hydra can recommend the nearest hospital.
            </p>
          </div>

          {/* Step-by-step browser unlock guide */}
          <div className="rounded-xl border border-[#1e2d4a] bg-[#080c18] p-4 mb-5 space-y-3">
            {[
              {
                num: "1",
                icon: "🔒",
                text: (
                  <>
                    Click the <strong className="text-white">lock icon</strong> (or ⓘ) in your
                    browser&apos;s address bar at the top of the page
                  </>
                ),
              },
              {
                num: "2",
                icon: "📍",
                text: (
                  <>
                    Find <strong className="text-white">Location</strong> in the permissions
                    list and change it to <strong className="text-emerald-400">Allow</strong>
                  </>
                ),
              },
              {
                num: "3",
                icon: "🔄",
                text: (
                  <>
                    Click <strong className="text-white">Reload</strong> — the location prompt
                    will appear and Hydra will detect your position automatically
                  </>
                ),
              },
            ].map(({ num, icon, text }) => (
              <div key={num} className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-400">
                  {num}
                </span>
                <div className="flex items-start gap-2 min-w-0">
                  <span className="text-sm shrink-0">{icon}</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Reload button */}
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-[.98] py-2.5 text-sm font-semibold text-white transition-all mb-3"
          >
            <RefreshCw className="h-4 w-4" />
            Reload Page
          </button>

          <button
            onClick={() => setStep("done")}
            className="w-full text-center text-xs text-slate-600 hover:text-slate-400 transition-colors py-1"
          >
            Skip — use without location
          </button>
        </div>
      </div>
    </div>
  );
}
