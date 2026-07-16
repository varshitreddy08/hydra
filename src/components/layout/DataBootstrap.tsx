"use client";

import { useEffect } from "react";
import { useSimulationStore } from "@/lib/store/simulationStore";

export function DataBootstrap() {
  const loadHospitalsFromDB = useSimulationStore((s) => s.loadHospitalsFromDB);

  useEffect(() => {
    loadHospitalsFromDB();
  }, [loadHospitalsFromDB]);

  return null;
}
