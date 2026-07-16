"use client";

import { useEffect, useState } from "react";
import { useSimulationStore } from "@/lib/store/simulationStore";

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

  return null;
}
