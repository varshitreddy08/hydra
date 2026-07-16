"use client";

import { FileText } from "lucide-react";
import { useSimulationStore } from "@/lib/store/simulationStore";
import type { Patient } from "@/types";

interface Props {
  myPatients: Patient[];
}

export function HospitalDecisionsTab({ myPatients }: Props) {
  const { decisions, resources } = useSimulationStore();

  const myPatientIds = new Set(myPatients.map(p => p.id));
  const myDecisions  = decisions.filter(d => myPatientIds.has(d.patientId));

  const allocated = myDecisions.filter(d => d.outcome === "ALLOCATED").length;
  const failed    = myDecisions.filter(d => d.outcome === "FAILED").length;
  const avgMs     = myDecisions.length > 0
    ? Math.round(myDecisions.reduce((s, d) => s + d.decisionTimeMs, 0) / myDecisions.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Decisions</h1>
        <p className="text-sm text-slate-400 mt-0.5">Allocation decisions for patients at your hospital</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Allocated", value: allocated, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
          { label: "Failed",    value: failed,    color: "text-red-400 bg-red-500/10 border-red-500/30" },
          { label: "Avg. Time", value: `${avgMs}ms`, color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`border rounded-xl p-4 ${color}`}>
            <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Decisions list */}
      {myDecisions.length === 0 ? (
        <div className="text-center py-12 bg-[#0d1526] border border-dashed border-[#1e2d4a] rounded-xl">
          <FileText className="w-8 h-8 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No decisions recorded yet.</p>
          <p className="text-slate-600 text-xs mt-1">Decisions appear as the system allocates resources to your patients.</p>
        </div>
      ) : (
        <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2d4a]">
            <h2 className="text-sm font-semibold text-slate-300">Decision Log</h2>
            <span className="text-xs text-slate-500">{myDecisions.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1e2d4a] text-slate-500">
                  <th className="text-left px-4 py-2.5 font-medium">Outcome</th>
                  <th className="text-left px-4 py-2.5 font-medium">Patient</th>
                  <th className="text-left px-4 py-2.5 font-medium">Condition</th>
                  <th className="text-left px-4 py-2.5 font-medium">Allocated Resources</th>
                  <th className="text-left px-4 py-2.5 font-medium">Confidence</th>
                  <th className="text-left px-4 py-2.5 font-medium">Decision Time</th>
                  <th className="text-left px-4 py-2.5 font-medium">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2d4a]">
                {myDecisions.map(d => {
                  const patient = myPatients.find(p => p.id === d.patientId);
                  const allocatedResourceNames = d.allocatedResourceIds
                    .map(id => resources.find(r => r.id === id)?.name)
                    .filter(Boolean);
                  const when = new Date(d.decidedAt).toLocaleTimeString();

                  return (
                    <tr key={d.id} className="hover:bg-[#111b2e] transition-colors">
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${
                          d.outcome === "ALLOCATED"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-red-500/20 text-red-300"
                        }`}>{d.outcome}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {patient?.mrn ?? d.patientId.slice(0, 10)}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {patient?.condition.replace(/_/g, " ") ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {allocatedResourceNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {allocatedResourceNames.map((n, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[10px]">
                                {n}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-400"
                              style={{ width: `${Math.round(d.confidenceScore * 100)}%` }}
                            />
                          </div>
                          <span className="text-slate-400">{Math.round(d.confidenceScore * 100)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400">{d.decisionTimeMs}ms</td>
                      <td className="px-4 py-3 text-slate-500">{when}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reasoning for last decision */}
      {myDecisions[0]?.reasoningFactors?.length > 0 && (
        <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Latest Decision Reasoning</h3>
          <div className="space-y-2">
            {myDecisions[0].reasoningFactors.map((f, i) => (
              <div key={i} className="flex items-start justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      f.direction === "POSITIVE" ? "bg-emerald-400" :
                      f.direction === "NEGATIVE" ? "bg-red-400" : "bg-slate-400"
                    }`} />
                    <span className="text-slate-300 font-medium">{f.factor}</span>
                    <span className="text-slate-600">w={f.weight}</span>
                  </div>
                  <p className="text-slate-500 mt-0.5 ml-3.5">{f.explanation}</p>
                </div>
                <span className={`shrink-0 font-mono font-bold ${
                  f.direction === "POSITIVE" ? "text-emerald-400" :
                  f.direction === "NEGATIVE" ? "text-red-400" : "text-slate-400"
                }`}>{typeof f.value === "number" ? f.value.toFixed(2) : f.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
