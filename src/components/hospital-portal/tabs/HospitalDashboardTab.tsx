"use client";

import { Activity, Clock, AlertTriangle, GitBranch, UserPlus, ArrowRight } from "lucide-react";
import { useSimulationStore } from "@/lib/store/simulationStore";
import { ActiveNegotiationPanel } from "@/components/dashboard/ActiveNegotiationPanel";
import type { Patient, Resource } from "@/types";

interface Props {
  hospitalId: string;
  hospitalName: string;
  myPatients: Patient[];
  hospitalResources: Resource[];
  onAdmit: () => void;
  onViewPatient: (p: Patient) => void;
  onGoToPatients: () => void;
}

const TRIAGE_CLS: Record<string, string> = {
  P1_IMMEDIATE:   "bg-red-500/20 text-red-300 border-red-500/40",
  P2_EMERGENT:    "bg-orange-500/20 text-orange-300 border-orange-500/40",
  P3_URGENT:      "bg-amber-500/20 text-amber-300 border-amber-500/40",
  P4_LESS_URGENT: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  P5_NON_URGENT:  "bg-slate-700 text-slate-400 border-slate-600",
};

export function HospitalDashboardTab({
  hospitalName, myPatients, hospitalResources, onAdmit, onViewPatient, onGoToPatients,
}: Props) {
  const { decisions } = useSimulationStore();

  const activeCount  = myPatients.filter(p => p.status === "ALLOCATED" || p.status === "IN_TREATMENT").length;
  const waitingCount = myPatients.filter(p => p.status === "WAITING").length;
  const criticalCount= myPatients.filter(p => p.triageScore.triageLevel === "P1_IMMEDIATE").length;
  const referredCount= myPatients.filter(p => p.referredHospitalIds && p.referredHospitalIds.length > 0).length;

  const myPatientIds = new Set(myPatients.map(p => p.id));
  const myDecisions  = decisions.filter(d => myPatientIds.has(d.patientId)).slice(0, 5);

  const availableRes  = hospitalResources.filter(r => r.status === "AVAILABLE").length;
  const occupiedRes   = hospitalResources.filter(r => r.status === "OCCUPIED").length;
  const utilPct = hospitalResources.length > 0
    ? Math.round((occupiedRes / hospitalResources.length) * 100) : 0;

  const recentPatients = [...myPatients]
    .sort((a, b) => b.arrivedAt - a.arrivedAt)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{hospitalName}</h1>
          <p className="text-sm text-slate-400 mt-0.5">Hospital operations overview</p>
        </div>
        <button
          onClick={onAdmit}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Admit Patient
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Patients", value: activeCount,   color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", Icon: Activity },
          { label: "Waiting",         value: waitingCount,  color: "text-amber-400 bg-amber-500/10 border-amber-500/30",   Icon: Clock },
          { label: "Critical (P1)",   value: criticalCount, color: "text-red-400 bg-red-500/10 border-red-500/30",         Icon: AlertTriangle },
          { label: "Referred Out",    value: referredCount, color: "text-purple-400 bg-purple-500/10 border-purple-500/30", Icon: GitBranch },
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

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Resource utilisation */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-300">Resource Utilisation</h2>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                utilPct > 80 ? "bg-red-500/20 text-red-300" :
                utilPct > 60 ? "bg-amber-500/20 text-amber-300" :
                "bg-emerald-500/20 text-emerald-300"
              }`}>{utilPct}% occupied</span>
            </div>

            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
              <div
                className={`h-full rounded-full transition-all ${
                  utilPct > 80 ? "bg-red-400" : utilPct > 60 ? "bg-amber-400" : "bg-emerald-400"
                }`}
                style={{ width: `${utilPct}%` }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {hospitalResources.map(r => (
                <div key={r.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${
                  r.status === "AVAILABLE"   ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300" :
                  r.status === "OCCUPIED"    ? "bg-red-500/5 border-red-500/20 text-red-300" :
                  r.status === "MAINTENANCE" ? "bg-amber-500/5 border-amber-500/20 text-amber-300" :
                  "bg-slate-800 border-slate-700 text-slate-400"
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    r.status === "AVAILABLE" ? "bg-emerald-400" :
                    r.status === "OCCUPIED"  ? "bg-red-400" :
                    "bg-amber-400"
                  }`} />
                  <span className="truncate font-medium">{r.name}</span>
                </div>
              ))}
              {hospitalResources.length === 0 && (
                <p className="text-xs text-slate-600 col-span-3">No resources registered for this hospital.</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#1e2d4a] text-center text-xs">
              {[
                { label: "Available",    value: availableRes, cls: "text-emerald-400" },
                { label: "Occupied",     value: occupiedRes,  cls: "text-red-400" },
                { label: "Total",        value: hospitalResources.length, cls: "text-white" },
              ].map(({ label, value, cls }) => (
                <div key={label}>
                  <p className={`text-lg font-bold ${cls}`}>{value}</p>
                  <p className="text-slate-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent patients */}
          <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2d4a]">
              <h2 className="text-sm font-semibold text-slate-300">Recent Patients</h2>
              <button
                onClick={onGoToPatients}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {recentPatients.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-8">No patients yet.</p>
            ) : (
              <div className="divide-y divide-[#1e2d4a]">
                {recentPatients.map(p => {
                  const triageCls = TRIAGE_CLS[p.triageScore.triageLevel] ?? TRIAGE_CLS.P5_NON_URGENT;
                  return (
                    <button
                      key={p.id}
                      onClick={() => onViewPatient(p)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#111b2e] transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${triageCls}`}>
                          {p.triageScore.triageLevel.replace("_", " ").split("_")[0]}
                        </span>
                        <div>
                          <p className="text-xs font-medium text-white">{p.mrn} · {p.age}y {p.sex}</p>
                          <p className="text-[10px] text-slate-500">{p.condition.replace(/_/g, " ")}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {Math.floor((Date.now() - p.arrivedAt) / 60000)}m ago
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Active negotiation */}
        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Active Negotiation</h2>
          <ActiveNegotiationPanel />

          {/* Recent decisions */}
          {myDecisions.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recent Decisions</h3>
              {myDecisions.map(d => (
                <div key={d.id} className="flex items-center justify-between px-3 py-2 bg-[#111b2e] border border-[#1e2d4a] rounded-lg text-xs">
                  <span className={`px-2 py-0.5 rounded-full font-medium ${
                    d.outcome === "ALLOCATED" ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
                  }`}>{d.outcome}</span>
                  <span className="text-slate-500 font-mono">{d.patientId.slice(4, 12)}</span>
                  <span className="text-slate-600">{d.decisionTimeMs}ms</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
