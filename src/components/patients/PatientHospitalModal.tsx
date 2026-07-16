"use client";

import { X, Building2, MapPin, Phone, CheckCircle2, Bed } from "lucide-react";
import { useSimulationStore } from "@/lib/store/simulationStore";
import type { Patient } from "@/types";

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  OPERATING_ROOM: "Operating Room",
  ICU_BED: "ICU Bed",
  EMERGENCY_BAY: "Emergency Bay",
  VENTILATOR: "Ventilator",
  CT_SCANNER: "CT Scanner",
  SURGEON: "Surgeon",
  ANESTHESIOLOGIST: "Anesthesiologist",
  NURSE_ICU: "ICU Nurse",
  NURSE_ED: "ED Nurse",
  CARDIOLOGIST: "Cardiologist",
  TRAUMA_SURGEON: "Trauma Surgeon",
  DEFIBRILLATOR: "Defibrillator",
  BLOOD_BANK: "Blood Bank",
};

interface Props {
  patient: Patient;
  onClose: () => void;
}

export function PatientHospitalModal({ patient, onClose }: Props) {
  const { resources, hospitals } = useSimulationStore();

  const allocatedResources = resources.filter((r) =>
    patient.allocatedResources.includes(r.id)
  );

  // Find hospital from first allocated resource
  const hospitalId = allocatedResources[0]?.hospitalId;
  const hospital = hospitals.find((h) => h.id === hospitalId);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#1e2d4a] bg-[#0d1526] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e2d4a] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Building2 className="h-4 w-4 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-white">Allocated Hospital</h2>
              <p className="text-[10px] text-slate-500">{patient.mrn} · {patient.condition.replace(/_/g, " ")}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {hospital ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Building2 className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-bold text-white">{hospital.name}</p>
                  {hospital.address && (
                    <p className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                      <MapPin className="h-3 w-3" /> {hospital.address}
                    </p>
                  )}
                  {hospital.phone && (
                    <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                      <Phone className="h-3 w-3" /> {hospital.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-[#1e2d4a] bg-[#111b2e] p-4 text-sm text-slate-500 text-center">
              No hospital information available
            </div>
          )}

          {/* Allocated resources */}
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
              <Bed className="h-3.5 w-3.5" />
              Allocated Resources ({allocatedResources.length})
            </p>
            {allocatedResources.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-4">No resources allocated yet</p>
            ) : (
              <div className="space-y-2">
                {allocatedResources.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-lg border border-[#1e2d4a] bg-[#111b2e] px-3 py-2"
                  >
                    <div>
                      <p className="text-xs font-semibold text-white">{r.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {RESOURCE_TYPE_LABELS[r.type] ?? r.type} · {r.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-[10px] font-semibold text-emerald-400">
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-[#1e2d4a] px-5 py-3">
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-[#1e2d4a] py-2 text-sm text-slate-400 hover:bg-white/5 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
