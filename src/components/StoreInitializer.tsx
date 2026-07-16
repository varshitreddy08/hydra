"use client";

import { useEffect } from "react";
import { useSimulationStore } from "@/lib/store/simulationStore";

export default function StoreInitializer() {
  const loadHospitalsFromDB = useSimulationStore((s) => s.loadHospitalsFromDB);
  const loadResourcesFromDB = useSimulationStore((s) => s.loadResourcesFromDB);
  const loadPatientsFromDB = useSimulationStore((s) => s.loadPatientsFromDB);

  useEffect(() => {
    Promise.all([loadHospitalsFromDB(), loadResourcesFromDB(), loadPatientsFromDB()]);
  }, [loadHospitalsFromDB, loadResourcesFromDB, loadPatientsFromDB]);

  return null;
}
