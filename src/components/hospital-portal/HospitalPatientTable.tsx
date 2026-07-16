"use client";

import { AlertTriangle, GitBranch, ChevronRight, Clock } from "lucide-react";
import type { Patient, Resource } from "@/types";

const TRIAGE_META: Record<string, { label: string; cls: string }> = {
  P1_IMMEDIATE:  { label: "P1 IMMEDIATE",  cls: "bg-red-500/20 text-red-300 border-red-500/40 animate-pulse" },
  P2_EMERGENT:   { label: "P2 EMERGENT",   cls: "bg-orange-500/20 text-orange-300 border-orange-500/40" },
  P3_URGENT:     { label: "P3 URGENT",     cls: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
  P4_LESS_URGENT:{ label: "P4 LESS URGENT",cls: "bg-blue-500/20 text-blue-300 border-blue-500/40" },
  P5_NON_URGENT: { label: "P5 NON-URGENT", cls: "bg-slate-700 text-slate-400 border-slate-600" },
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  WAITING:        { label: "Waiting",       cls: "bg-amber-500/15 text-amber-300" },
  IN_NEGOTIATION: { label: "Allocating",    cls: "bg-blue-500/15 text-blue-300" },
  ALLOCATED:      { label: "Allocated",     cls: "bg-emerald-500/15 text-emerald-300" },
  IN_TREATMENT:   { label: "In Treatment",  cls: "bg-emerald-500/15 text-emerald-300" },
};

function waitTime(arrivedAt: number) {
  const mins = Math.floor((Date.now() - arrivedAt) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

interface Props {
  patients: Patient[];
  hospitalResourceIds: Set<string>;
  resources: Resource[];
  onSelectPatient: (p: Patient) => void;
}

export function HospitalPatientTable({ patients, hospitalResourceIds, resources, onSelectPatient }: Props) {
  if (patients.length === 0) {
    return (
      <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-xl p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-5 h-5 text-slate-600" />
        </div>
        <p className="text-slate-400 text-sm font-medium">No patients at this time</p>
        <p className="text-slate-600 text-xs mt-1">Admit a patient or wait for incoming triage.</p>
      </div>
    );
  }

  const sorted = [...patients].sort((a, b) => b.triageScore.raw - a.triageScore.raw);

  return (
    <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2d4a]">
        <h2 className="text-sm font-semibold text-slate-300">Patient Queue</h2>
        <span className="text-xs text-slate-500">{patients.length} patient{patients.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1e2d4a] text-slate-500">
              <th className="text-left px-4 py-2.5 font-medium">MRN</th>
              <th className="text-left px-4 py-2.5 font-medium">Patient</th>
              <th className="text-left px-4 py-2.5 font-medium">Condition</th>
              <th className="text-left px-4 py-2.5 font-medium">Triage</th>
              <th className="text-left px-4 py-2.5 font-medium">Vitals</th>
              <th className="text-left px-4 py-2.5 font-medium">Status</th>
              <th className="text-left px-4 py-2.5 font-medium">Wait</th>
              <th className="text-left px-4 py-2.5 font-medium">Referral</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2d4a]">
            {sorted.map((patient) => {
              const triage = TRIAGE_META[patient.triageScore.triageLevel] ?? TRIAGE_META.P5_NON_URGENT;
              const status = STATUS_META[patient.status] ?? STATUS_META.WAITING;
              const hasReferral = patient.referredHospitalIds && patient.referredHospitalIds.length > 0;
              const isP1 = patient.triageScore.triageLevel === "P1_IMMEDIATE";
              const allocatedHere = patient.allocatedResources.filter((id) => hospitalResourceIds.has(id));
              const allocatedResourceNames = allocatedHere
                .map((id) => resources.find((r) => r.id === id)?.name)
                .filter(Boolean);

              return (
                <tr
                  key={patient.id}
                  onClick={() => onSelectPatient(patient)}
                  className={`cursor-pointer transition-colors hover:bg-[#111b2e] group ${
                    isP1 ? "bg-red-500/5" : ""
                  }`}
                >
                  {/* MRN */}
                  <td className="px-4 py-3 font-mono text-slate-400">{patient.mrn}</td>

                  {/* Patient */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {isP1 && <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />}
                      <span className="text-white font-medium">
                        {patient.age}y {patient.sex}
                      </span>
                    </div>
                  </td>

                  {/* Condition */}
                  <td className="px-4 py-3 text-slate-300">
                    {patient.condition.replace(/_/g, " ")}
                    {allocatedResourceNames.length > 0 && (
                      <div className="text-[10px] text-slate-600 mt-0.5">
                        {allocatedResourceNames.join(", ")}
                      </div>
                    )}
                  </td>

                  {/* Triage */}
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${triage.cls}`}>
                      {triage.label}
                    </span>
                  </td>

                  {/* Vitals */}
                  <td className="px-4 py-3 text-slate-400 font-mono">
                    <div className="space-y-0.5">
                      <div>HR <span className="text-white">{patient.vitals.heartRate}</span></div>
                      <div>
                        SpO₂{" "}
                        <span
                          className={
                            patient.vitals.oxygenSaturation < 90
                              ? "text-red-400"
                              : patient.vitals.oxygenSaturation < 94
                              ? "text-amber-400"
                              : "text-white"
                          }
                        >
                          {patient.vitals.oxygenSaturation}%
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${status.cls}`}>
                      {status.label}
                    </span>
                  </td>

                  {/* Wait time */}
                  <td className="px-4 py-3 text-slate-500">{waitTime(patient.arrivedAt)}</td>

                  {/* Referral */}
                  <td className="px-4 py-3">
                    {hasReferral ? (
                      <div className="flex items-center gap-1 text-purple-400">
                        <GitBranch className="w-3 h-3" />
                        <span className="text-[10px]">{patient.referredHospitalIds!.length}</span>
                      </div>
                    ) : (
                      <span className="text-slate-700 text-[10px]">—</span>
                    )}
                  </td>

                  {/* Arrow */}
                  <td className="px-4 py-3">
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
