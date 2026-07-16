"use client";

import { useState } from "react";
import { X, Building2, MapPin, Phone, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useSimulationStore } from "@/lib/store/simulationStore";
import type { Patient } from "@/types";

interface Props {
  patient: Patient;
  onClose: () => void;
  onAttach: (hospitalId: string) => Promise<void>;
}

export function AttachHospitalModal({ patient, onClose, onAttach }: Props) {
  const { hospitals, resources } = useSimulationStore();
  const [attachingId, setAttachingId] = useState<string | null>(null);

  async function handleSelect(hospitalId: string) {
    setAttachingId(hospitalId);
    await onAttach(hospitalId);
    setAttachingId(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#1e2d4a] bg-[#0d1526] shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e2d4a] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 border border-violet-500/20">
              <Building2 className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Attach to Hospital</h2>
              <p className="text-[10px] text-slate-500">
                {patient.mrn} · {patient.condition.replace(/_/g, " ")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
          {hospitals.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[#1e2d4a] p-8 text-center">
              <Building2 className="h-7 w-7 text-slate-700" />
              <p className="text-sm text-slate-500">No hospitals available</p>
              <p className="text-xs text-slate-600">Add a hospital in the Resources page first.</p>
            </div>
          ) : (
            hospitals.map((h) => {
              const hResources = resources.filter((r) => r.hospitalId === h.id);
              const available = hResources.filter((r) => r.status === "AVAILABLE").length;
              const total = hResources.length;
              const requiredMatches = patient.requiresResourceTypes.filter((type) =>
                hResources.some((r) => r.type === type && r.status === "AVAILABLE")
              ).length;
              const matchRatio =
                patient.requiresResourceTypes.length > 0
                  ? requiredMatches / patient.requiresResourceTypes.length
                  : 0;

              const isAttaching = attachingId === h.id;

              return (
                <div
                  key={h.id}
                  className={`rounded-xl border p-4 transition-all ${
                    matchRatio === 1
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : matchRatio > 0
                      ? "border-amber-500/20 bg-amber-500/5"
                      : "border-[#1e2d4a] bg-[#080c18]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{h.name}</p>
                      {h.address && (
                        <p className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5 truncate">
                          <MapPin className="h-2.5 w-2.5 shrink-0" /> {h.address}
                        </p>
                      )}
                      {h.phone && (
                        <p className="flex items-center gap-1 text-[11px] text-slate-600 mt-0.5">
                          <Phone className="h-2.5 w-2.5 shrink-0" /> {h.phone}
                        </p>
                      )}

                      {/* Resource summary */}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">
                          {available}/{total} resources available
                        </span>
                        {patient.requiresResourceTypes.length > 0 && (
                          matchRatio === 1 ? (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" /> Full match
                            </span>
                          ) : matchRatio > 0 ? (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400">
                              <AlertCircle className="h-3 w-3" /> Partial ({requiredMatches}/{patient.requiresResourceTypes.length})
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-red-400">
                              <AlertCircle className="h-3 w-3" /> No match
                            </span>
                          )
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelect(h.id)}
                      disabled={!!attachingId}
                      className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 ${
                        matchRatio === 1
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                          : matchRatio > 0
                          ? "bg-amber-600 hover:bg-amber-500 text-white"
                          : "bg-[#1e2d4a] hover:bg-[#2a3f5f] text-slate-300"
                      }`}
                    >
                      {isAttaching ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Attach"
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-[#1e2d4a] px-5 py-3">
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-[#1e2d4a] py-2 text-sm text-slate-400 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
