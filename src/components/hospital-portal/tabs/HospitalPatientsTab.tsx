"use client";

import { useState } from "react";
import {
  UserPlus, AlertTriangle, Clock, GitBranch, ChevronRight,
  Zap, CheckCircle, Loader2,
} from "lucide-react";
import { useSimulationStore } from "@/lib/store/simulationStore";
import type { Patient, Resource } from "@/types";

const TRIAGE_CLS: Record<string, string> = {
  P1_IMMEDIATE:   "bg-red-500/20 text-red-300 border-red-500/40 animate-pulse",
  P2_EMERGENT:    "bg-orange-500/20 text-orange-300 border-orange-500/40",
  P3_URGENT:      "bg-amber-500/20 text-amber-300 border-amber-500/40",
  P4_LESS_URGENT: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  P5_NON_URGENT:  "bg-slate-700 text-slate-400 border-slate-600",
};

const STATUS_CLS: Record<string, string> = {
  WAITING:        "bg-amber-500/15 text-amber-300",
  IN_NEGOTIATION: "bg-blue-500/15 text-blue-300",
  ALLOCATED:      "bg-emerald-500/15 text-emerald-300",
  IN_TREATMENT:   "bg-emerald-500/15 text-emerald-300",
};

function waitLabel(ts: number) {
  const m = Math.floor((Date.now() - ts) / 60000);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

interface Props {
  hospitalId: string;
  myPatients: Patient[];
  hospitalResources: Resource[];
  hospitalResourceIds: Set<string>;
  onAdmit: () => void;
  onViewPatient: (p: Patient) => void;
}

export function HospitalPatientsTab({
  hospitalId, myPatients, hospitalResources, hospitalResourceIds, onAdmit, onViewPatient,
}: Props) {
  const { forceAllocateToHospital } = useSimulationStore();
  const [allocating, setAllocating] = useState<string | null>(null);

  async function handleAllocate(patientId: string) {
    setAllocating(patientId);
    await forceAllocateToHospital(patientId, hospitalId);
    setAllocating(null);
  }

  const sorted = [...myPatients].sort((a, b) => b.triageScore.raw - a.triageScore.raw);

  const waiting   = myPatients.filter(p => p.status === "WAITING").length;
  const active    = myPatients.filter(p => p.status === "ALLOCATED" || p.status === "IN_TREATMENT").length;
  const critical  = myPatients.filter(p => p.triageScore.triageLevel === "P1_IMMEDIATE").length;
  const referred  = myPatients.filter(p => p.referredHospitalIds?.length).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Patients</h1>
          <p className="text-sm text-slate-400 mt-0.5">All patients at your hospital — click a row for full details</p>
        </div>
        <button
          onClick={onAdmit}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Admit Patient
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Waiting",       value: waiting,  color: "text-amber-400 bg-amber-500/10 border-amber-500/30",   Icon: Clock },
          { label: "Active",        value: active,   color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", Icon: CheckCircle },
          { label: "Critical (P1)", value: critical, color: "text-red-400 bg-red-500/10 border-red-500/30",          Icon: AlertTriangle },
          { label: "Referred Out",  value: referred, color: "text-purple-400 bg-purple-500/10 border-purple-500/30", Icon: GitBranch },
        ].map(({ label, value, color, Icon }) => (
          <div key={label} className={`border rounded-xl p-4 ${color}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium opacity-80">{label}</span>
              <Icon className="w-4 h-4 opacity-60" />
            </div>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Patient table */}
      {sorted.length === 0 ? (
        <div className="bg-[#0d1526] border border-dashed border-[#1e2d4a] rounded-xl p-12 text-center">
          <Clock className="w-8 h-8 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">No patients at this hospital yet</p>
          <p className="text-slate-600 text-xs mt-1">Admit a patient or wait for the system to assign one here.</p>
        </div>
      ) : (
        <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2d4a]">
            <h2 className="text-sm font-semibold text-slate-300">Patient Queue</h2>
            <span className="text-xs text-slate-500">{sorted.length} patient{sorted.length !== 1 ? "s" : ""}</span>
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
                  <th className="text-left px-4 py-2.5 font-medium">Resources</th>
                  <th className="text-left px-4 py-2.5 font-medium">Actions</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2d4a]">
                {sorted.map(p => {
                  const tCls   = TRIAGE_CLS[p.triageScore.triageLevel] ?? TRIAGE_CLS.P5_NON_URGENT;
                  const sCls   = STATUS_CLS[p.status] ?? STATUS_CLS.WAITING;
                  const isP1   = p.triageScore.triageLevel === "P1_IMMEDIATE";
                  const canAllocate = p.status === "WAITING";
                  const allocHere = p.allocatedResources
                    .filter(id => hospitalResourceIds.has(id))
                    .map(id => hospitalResources.find(r => r.id === id)?.name)
                    .filter(Boolean);

                  return (
                    <tr
                      key={p.id}
                      className={`group transition-colors hover:bg-[#111b2e] ${isP1 ? "bg-red-500/5" : ""}`}
                    >
                      <td className="px-4 py-3 font-mono text-slate-400">{p.mrn}</td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {isP1 && <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />}
                          <span className="text-white font-medium">{p.age}y {p.sex}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-slate-300">
                        {p.condition.replace(/_/g, " ")}
                        {p.conditionDetails && (
                          <p className="text-[10px] text-slate-600 mt-0.5 truncate max-w-[180px]">{p.conditionDetails}</p>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${tCls}`}>
                          {p.triageScore.triageLevel.replace("_", " ").split("_")[0]}
                        </span>
                        <div className="text-[10px] text-slate-600 mt-0.5">{p.triageScore.raw.toFixed(0)}/100</div>
                      </td>

                      <td className="px-4 py-3 font-mono text-slate-400">
                        <div>HR <span className="text-white">{p.vitals.heartRate}</span></div>
                        <div>BP <span className="text-white">{p.vitals.systolicBP}/{p.vitals.diastolicBP}</span></div>
                        <div>SpO₂ <span className={p.vitals.oxygenSaturation < 90 ? "text-red-400" : "text-white"}>
                          {p.vitals.oxygenSaturation}%
                        </span></div>
                        <div>GCS <span className={p.vitals.consciousnessScore < 10 ? "text-red-400" : "text-white"}>
                          {p.vitals.consciousnessScore}
                        </span></div>
                      </td>

                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${sCls}`}>
                          {p.status.replace(/_/g, " ")}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-500">{waitLabel(p.arrivedAt)}</td>

                      <td className="px-4 py-3">
                        {allocHere.length > 0 ? (
                          <div className="space-y-0.5">
                            {allocHere.map((n, i) => (
                              <div key={i} className="text-[10px] text-emerald-400 flex items-center gap-1">
                                <div className="w-1 h-1 rounded-full bg-emerald-400" />
                                {n}
                              </div>
                            ))}
                          </div>
                        ) : (
                          p.referredHospitalIds?.length ? (
                            <div className="flex items-center gap-1 text-purple-400 text-[10px]">
                              <GitBranch className="w-3 h-3" />
                              {p.referredHospitalIds.length} referred
                            </div>
                          ) : (
                            <span className="text-slate-700 text-[10px]">—</span>
                          )
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {canAllocate && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAllocate(p.id); }}
                            disabled={allocating === p.id}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600/20 border border-blue-500/30 text-blue-300 rounded-lg text-[10px] font-medium hover:bg-blue-600/30 transition-colors disabled:opacity-50"
                          >
                            {allocating === p.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Zap className="w-3 h-3" />
                            }
                            {allocating === p.id ? "Allocating…" : "Allocate"}
                          </button>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <button
                          onClick={() => onViewPatient(p)}
                          className="text-slate-600 hover:text-blue-400 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
