"use client";

import { useSimulationStore } from "@/lib/store/simulationStore";
import { ResourceAgentCard } from "@/components/resources/ResourceAgentCard";
import { statusColor } from "@/lib/utils/formatters";

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  OPERATING_ROOM: "Operating Rooms",
  ICU_BED: "ICU Beds",
  EMERGENCY_BAY: "Emergency Bays",
  VENTILATOR: "Ventilators",
  CT_SCANNER: "CT Scanners",
  SURGEON: "Surgeons",
  ANESTHESIOLOGIST: "Anesthesiologists",
  NURSE_ICU: "ICU Nurses",
  NURSE_ED: "ED Nurses",
  CARDIOLOGIST: "Cardiologists",
  TRAUMA_SURGEON: "Trauma Surgeons",
  DEFIBRILLATOR: "Defibrillators",
  BLOOD_BANK: "Blood Bank",
};

export default function ResourcesPage() {
  const { resources, agents } = useSimulationStore();

  // Group resources by type
  const grouped = resources.reduce<Record<string, typeof resources>>(
    (acc, r) => {
      if (!acc[r.type]) acc[r.type] = [];
      acc[r.type].push(r);
      return acc;
    },
    {}
  );

  const available = resources.filter((r) => r.status === "AVAILABLE").length;
  const occupied = resources.filter((r) => r.status === "OCCUPIED").length;
  const maintenance = resources.filter((r) => r.status === "MAINTENANCE").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Resource Management</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Hospital resources as autonomous negotiating agents
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {[
            { label: "Available", count: available, cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
            { label: "Occupied", count: occupied, cls: "text-red-400 bg-red-500/10 border-red-500/30" },
            { label: "Maintenance", count: maintenance, cls: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
          ].map(({ label, count, cls }) => (
            <span key={label} className={`px-2.5 py-1 rounded-lg border font-medium ${cls}`}>
              {count} {label}
            </span>
          ))}
        </div>
      </div>

      {/* Resource groups */}
      {Object.entries(grouped).map(([type, typeResources]) => (
        <div key={type}>
          <h2 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
            {RESOURCE_TYPE_LABELS[type] ?? type}
            <span className="text-xs text-slate-600">
              ({typeResources.length})
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {typeResources.map((resource) => {
              const agent = agents.find((a) => a.resourceId === resource.id);
              if (!agent) return null;
              return (
                <ResourceAgentCard
                  key={resource.id}
                  resource={resource}
                  agent={agent}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
