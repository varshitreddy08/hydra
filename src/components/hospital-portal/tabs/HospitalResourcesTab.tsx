"use client";

import { useState } from "react";
import {
  Bed, Wind, Scan, Stethoscope, Scissors, Syringe, Zap, Droplets,
  ActivitySquare, User, Shield, FlaskConical, Plus, Pencil,
} from "lucide-react";
import type { Patient, Resource, ResourceType } from "@/types";
import { AddResourceDialog } from "@/components/resources/AddResourceDialog";
import { EditResourceDialog } from "@/components/resources/EditResourceDialog";

const ICONS: Record<ResourceType, React.ReactNode> = {
  OPERATING_ROOM:    <Scissors className="w-5 h-5" />,
  ICU_BED:           <Bed className="w-5 h-5" />,
  EMERGENCY_BAY:     <Zap className="w-5 h-5" />,
  VENTILATOR:        <Wind className="w-5 h-5" />,
  CT_SCANNER:        <Scan className="w-5 h-5" />,
  SURGEON:           <User className="w-5 h-5" />,
  ANESTHESIOLOGIST:  <Syringe className="w-5 h-5" />,
  NURSE_ICU:         <Shield className="w-5 h-5" />,
  NURSE_ED:          <Shield className="w-5 h-5" />,
  CARDIOLOGIST:      <ActivitySquare className="w-5 h-5" />,
  TRAUMA_SURGEON:    <Stethoscope className="w-5 h-5" />,
  DEFIBRILLATOR:     <Zap className="w-5 h-5" />,
  BLOOD_BANK:        <Droplets className="w-5 h-5" />,
};

const STATUS_META: Record<string, { border: string; icon: string; label: string }> = {
  AVAILABLE:   { border: "border-emerald-500/30", icon: "bg-emerald-400",  label: "Available" },
  OCCUPIED:    { border: "border-red-500/30",     icon: "bg-red-400",      label: "Occupied" },
  RESERVED:    { border: "border-amber-500/30",   icon: "bg-amber-400",    label: "Reserved" },
  MAINTENANCE: { border: "border-amber-500/30",   icon: "bg-amber-400",    label: "Maintenance" },
  OFFLINE:     { border: "border-slate-600/30",   icon: "bg-slate-600",    label: "Offline" },
};

interface Props {
  hospitalId: string;
  hospitalResources: Resource[];
  myPatients: Patient[];
}

export function HospitalResourcesTab({ hospitalId, hospitalResources, myPatients }: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [editResource, setEditResource] = useState<Resource | null>(null);

  const available   = hospitalResources.filter(r => r.status === "AVAILABLE").length;
  const occupied    = hospitalResources.filter(r => r.status === "OCCUPIED").length;
  const maintenance = hospitalResources.filter(r => r.status === "MAINTENANCE").length;
  const utilPct     = hospitalResources.length > 0
    ? Math.round((occupied / hospitalResources.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Resources</h1>
          <p className="text-sm text-slate-400 mt-0.5">All resources registered to your hospital</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Resource
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total",       value: hospitalResources.length, color: "text-white bg-[#111b2e] border-[#1e2d4a]" },
          { label: "Available",   value: available,   color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
          { label: "Occupied",    value: occupied,    color: "text-red-400 bg-red-500/10 border-red-500/30" },
          { label: "Maintenance", value: maintenance, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`border rounded-xl p-4 ${color}`}>
            <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Utilisation bar */}
      <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">Overall Utilisation</span>
          <span className={`text-sm font-bold ${
            utilPct > 80 ? "text-red-400" : utilPct > 60 ? "text-amber-400" : "text-emerald-400"
          }`}>{utilPct}%</span>
        </div>
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              utilPct > 80 ? "bg-red-400" : utilPct > 60 ? "bg-amber-400" : "bg-emerald-400"
            }`}
            style={{ width: `${utilPct}%` }}
          />
        </div>
      </div>

      {/* Resource cards */}
      {hospitalResources.length === 0 ? (
        <div className="text-center py-12 text-slate-600 text-sm">
          No resources registered for this hospital. Add one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {hospitalResources.map(r => {
            const meta = STATUS_META[r.status] ?? STATUS_META.OFFLINE;
            const icon = ICONS[r.type] ?? <FlaskConical className="w-5 h-5" />;
            const currentPatient = r.currentPatientId
              ? myPatients.find(p => p.id === r.currentPatientId)
              : null;

            return (
              <div
                key={r.id}
                className={`bg-[#111b2e] border rounded-xl p-4 flex flex-col gap-3 ${meta.border}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`shrink-0 ${
                      r.status === "AVAILABLE" ? "text-emerald-400" :
                      r.status === "OCCUPIED"  ? "text-red-400" :
                      "text-amber-400"
                    }`}>{icon}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{r.name}</p>
                      <p className="text-[10px] text-slate-500">{r.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${meta.icon}`} />
                      <span className="text-[10px] text-slate-400 font-medium">{meta.label}</span>
                    </div>
                    <button
                      onClick={() => setEditResource(r)}
                      className="rounded-lg p-1 text-slate-600 hover:bg-white/10 hover:text-slate-300 transition-colors"
                      title="Edit resource"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500">
                  {r.type.replace(/_/g, " ")}
                </div>

                {currentPatient && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    <p className="text-xs text-slate-400">
                      Patient <span className="font-mono font-semibold text-red-300">{currentPatient.mrn}</span>
                    </p>
                    <p className="text-[10px] text-slate-500">{currentPatient.condition.replace(/_/g, " ")}</p>
                  </div>
                )}

                {r.capabilities.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {r.capabilities.slice(0, 4).map(cap => (
                      <span key={cap} className="px-1.5 py-0.5 rounded border border-[#1e2d4a] bg-white/5 text-[10px] text-slate-400">
                        {cap}
                      </span>
                    ))}
                  </div>
                )}

                {r.utilizationHistory.length > 0 && (
                  <div className="flex items-end gap-px h-4">
                    {r.utilizationHistory.slice(-20).map((v, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-sm ${v ? "bg-red-400" : "bg-slate-700"}`}
                        style={{ height: v ? "100%" : "40%" }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AddResourceDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        hospitalId={hospitalId}
      />
      {editResource && (
        <EditResourceDialog
          resource={editResource}
          open={true}
          onClose={() => setEditResource(null)}
        />
      )}
    </div>
  );
}
