"use client";

import { useEffect } from "react";
import { useSimulationStore } from "@/lib/store/simulationStore";

export default function StoreInitializer() {
  const loadHospitalsFromDB = useSimulationStore((s) => s.loadHospitalsFromDB);
  const loadResourcesFromDB = useSimulationStore((s) => s.loadResourcesFromDB);

  useEffect(() => {
    Promise.all([loadHospitalsFromDB(), loadResourcesFromDB()]);
  }, [loadHospitalsFromDB, loadResourcesFromDB]);

  return null;
}
