"use client";

import {
  Bed,
  Wind,
  Scan,
  Stethoscope,
  Scissors,
  Syringe,
  Zap,
  Droplets,
  ActivitySquare,
  User,
  Shield,
  FlaskConical,
} from "lucide-react";
import { useSimulationStore } from "@/lib/store/simulationStore";
import { StatusDot } from "@/components/shared/StatusDot";
import { cn } from "@/lib/utils/cn";
import { statusColor } from "@/lib/utils/formatters";
import type { ResourceType } from "@/types";

const RESOURCE_ICONS: Record<ResourceType, React.ReactNode> = {
  OPERATING_ROOM: <Scissors className="h-5 w-5" />,
  ICU_BED: <Bed className="h-5 w-5" />,
  EMERGENCY_BAY: <Zap className="h-5 w-5" />,
  VENTILATOR: <Wind className="h-5 w-5" />,
  CT_SCANNER: <Scan className="h-5 w-5" />,
  SURGEON: <User className="h-5 w-5" />,
  ANESTHESIOLOGIST: <Syringe className="h-5 w-5" />,
  NURSE_ICU: <Shield className="h-5 w-5" />,
  NURSE_ED: <Shield className="h-5 w-5" />,
  CARDIOLOGIST: <ActivitySquare className="h-5 w-5" />,
  TRAUMA_SURGEON: <Stethoscope className="h-5 w-5" />,
  DEFIBRILLATOR: <Zap className="h-5 w-5" />,
  BLOOD_BANK: <Droplets className="h-5 w-5" />,
};

const STATUS_BORDER: Record<string, string> = {
  AVAILABLE: "border-emerald-500/30",
  OCCUPIED: "border-red-500/30",
  RESERVED: "border-amber-500/30",
  MAINTENANCE: "border-amber-500/30",
  OFFLINE: "border-gray-600/30",
};

export function ResourceStatusGrid() {
  const resources = useSimulationStore((s) => s.resources);
  const patients = useSimulationStore((s) => s.patients);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {resources.map((resource) => {
        const currentPatient = resource.currentPatientId
          ? patients.find((p) => p.id === resource.currentPatientId)
          : null;
        const borderClass = STATUS_BORDER[resource.status] ?? "border-[#1e2d4a]";
        const icon = RESOURCE_ICONS[resource.type] ?? <FlaskConical className="h-5 w-5" />;

        return (
          <div
            key={resource.id}
            className={cn(
              "card-hover flex flex-col gap-2 rounded-xl border bg-[#111b2e] p-3 transition-all",
              borderClass
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={cn("shrink-0", statusColor(resource.status))}>{icon}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{resource.name}</p>
                  <p className="text-xs text-gray-500">{resource.location}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
                <StatusDot status={resource.status} />
                <span className={cn("text-xs font-medium", statusColor(resource.status))}>
                  {resource.status}
                </span>
              </div>
            </div>

            {currentPatient && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1.5">
                <p className="text-xs text-gray-400">
                  Patient{" "}
                  <span className="font-mono font-semibold text-red-300">
                    {currentPatient.mrn}
                  </span>
                </p>
                <p className="text-xs text-gray-500">
                  {currentPatient.condition.replace(/_/g, " ")}
                </p>
              </div>
            )}

            {resource.capabilities.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {resource.capabilities.slice(0, 3).map((cap) => (
                  <span
                    key={cap}
                    className="rounded border border-[#1e2d4a] bg-white/5 px-1.5 py-0.5 text-[10px] text-gray-400"
                  >
                    {cap.replace(/_/g, " ")}
                  </span>
                ))}
                {resource.capabilities.length > 3 && (
                  <span className="px-1 text-[10px] text-gray-600">
                    +{resource.capabilities.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
