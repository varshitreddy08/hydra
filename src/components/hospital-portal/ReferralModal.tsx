"use client";

import { useState } from "react";
import { X, GitBranch, Check } from "lucide-react";
import { useSimulationStore } from "@/lib/store/simulationStore";
import type { Patient } from "@/types";

interface Props {
  patient: Patient;
  currentHospitalId: string;
  onClose: () => void;
}

export function ReferralModal({ patient, currentHospitalId, onClose }: Props) {
  const { hospitals, addReferral } = useSimulationStore();

  const otherHospitals = hospitals.filter((h) => h.id !== currentHospitalId);

  const [selected, setSelected] = useState<Set<string>>(
    new Set(patient.referredHospitalIds ?? [])
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSave() {
    addReferral(patient.id, Array.from(selected));
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-[#0d1526] border border-[#1e2d4a] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2d4a]">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-white">Refer to Hospital</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Patient info */}
        <div className="px-5 py-3 bg-[#080c18] border-b border-[#1e2d4a]">
          <p className="text-xs text-slate-400">
            Patient{" "}
            <span className="font-mono text-white">{patient.mrn}</span>
            {" · "}
            {patient.age}y {patient.sex}
            {" · "}
            <span className="text-slate-300">{patient.condition.replace(/_/g, " ")}</span>
          </p>
        </div>

        {/* Hospital list */}
        <div className="px-5 py-4 space-y-2 max-h-72 overflow-y-auto">
          <p className="text-xs text-slate-500 mb-3">
            Select hospitals to recommend for referral:
          </p>
          {otherHospitals.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-4">
              No other hospitals registered.
            </p>
          ) : (
            otherHospitals.map((h) => {
              const isChecked = selected.has(h.id);
              return (
                <button
                  key={h.id}
                  onClick={() => toggle(h.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                    isChecked
                      ? "bg-purple-500/10 border-purple-500/40 text-purple-200"
                      : "bg-[#111b2e] border-[#1e2d4a] text-slate-300 hover:border-purple-500/30 hover:text-white"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">{h.name}</p>
                    {h.address && (
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[260px]">
                        {h.address}
                      </p>
                    )}
                  </div>
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      isChecked
                        ? "bg-purple-500 border-purple-500"
                        : "border-slate-600"
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-[#1e2d4a]">
          <span className="text-xs text-slate-500">
            {selected.size} hospital{selected.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <GitBranch className="w-3.5 h-3.5" />
              Save Referral
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
