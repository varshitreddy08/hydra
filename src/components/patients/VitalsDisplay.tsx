"use client";

import { cn } from "@/lib/utils/cn";
import type { Vitals } from "@/types";

interface VitalsDisplayProps {
  vitals: Vitals;
}

interface VitalItem {
  label: string;
  shortLabel: string;
  value: string;
  unit: string;
  isAbnormal: boolean;
}

function isAbnormal(key: string, vitals: Vitals): boolean {
  switch (key) {
    case "hr":
      return vitals.heartRate < 60 || vitals.heartRate > 100;
    case "sbp":
      return vitals.systolicBP < 90 || vitals.systolicBP > 140;
    case "dbp":
      return vitals.diastolicBP < 60 || vitals.diastolicBP > 90;
    case "rr":
      return vitals.respiratoryRate < 12 || vitals.respiratoryRate > 20;
    case "spo2":
      return vitals.oxygenSaturation < 95;
    case "temp":
      return vitals.temperature < 36 || vitals.temperature > 38;
    case "gcs":
      return vitals.consciousnessScore < 13;
    default:
      return false;
  }
}

export function VitalsDisplay({ vitals }: VitalsDisplayProps) {
  const items: VitalItem[] = [
    {
      label: "Heart Rate",
      shortLabel: "HR",
      value: vitals.heartRate.toFixed(0),
      unit: "bpm",
      isAbnormal: isAbnormal("hr", vitals),
    },
    {
      label: "Blood Pressure",
      shortLabel: "BP",
      value: `${vitals.systolicBP.toFixed(0)}/${vitals.diastolicBP.toFixed(0)}`,
      unit: "mmHg",
      isAbnormal: isAbnormal("sbp", vitals) || isAbnormal("dbp", vitals),
    },
    {
      label: "Respiratory Rate",
      shortLabel: "RR",
      value: vitals.respiratoryRate.toFixed(0),
      unit: "/min",
      isAbnormal: isAbnormal("rr", vitals),
    },
    {
      label: "O₂ Saturation",
      shortLabel: "SpO₂",
      value: vitals.oxygenSaturation.toFixed(0),
      unit: "%",
      isAbnormal: isAbnormal("spo2", vitals),
    },
    {
      label: "Temperature",
      shortLabel: "Temp",
      value: vitals.temperature.toFixed(1),
      unit: "°C",
      isAbnormal: isAbnormal("temp", vitals),
    },
    {
      label: "Glasgow Coma Scale",
      shortLabel: "GCS",
      value: vitals.consciousnessScore.toFixed(0),
      unit: "/15",
      isAbnormal: isAbnormal("gcs", vitals),
    },
  ];

  return (
    <div className="flex flex-col gap-1">
      {items.map((item) => (
        <div
          key={item.shortLabel}
          className={cn(
            "flex items-center justify-between rounded-lg border px-3 py-1.5 transition-colors",
            item.isAbnormal
              ? "border-red-500/30 bg-red-500/10"
              : "border-[#1e2d4a] bg-white/5"
          )}
        >
          <div className="flex items-center gap-2">
            {item.isAbnormal && (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
            )}
            <span
              className={cn(
                "min-w-[3rem] text-xs font-semibold",
                item.isAbnormal ? "text-red-300" : "text-gray-300"
              )}
            >
              {item.shortLabel}
            </span>
            <span className="hidden text-xs text-gray-600 sm:inline">{item.label}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                "font-mono text-sm font-bold tabular-nums",
                item.isAbnormal ? "text-red-400" : "text-white"
              )}
            >
              {item.value}
            </span>
            <span className="text-xs text-gray-500">{item.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
