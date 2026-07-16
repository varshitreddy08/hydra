"use client";

import { Radio, CheckCircle, XCircle, Clock } from "lucide-react";
import { useSimulationStore } from "@/lib/store/simulationStore";
import { ActiveNegotiationPanel } from "@/components/dashboard/ActiveNegotiationPanel";
import { cn } from "@/lib/utils/cn";
import type { Patient } from "@/types";

const PHASE_COLORS: Record<string, string> = {
  IDLE:             "bg-gray-500/20 text-gray-300 border-gray-500/40",
  ANNOUNCEMENT:     "bg-blue-500/20 text-blue-300 border-blue-500/40",
  BIDDING:          "bg-purple-500/20 text-purple-300 border-purple-500/40",
  EVALUATION:       "bg-amber-500/20 text-amber-300 border-amber-500/40",
  DEPENDENCY_CHECK: "bg-orange-500/20 text-orange-300 border-orange-500/40",
  AWARD:            "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  COMPLETED:        "bg-emerald-600/20 text-emerald-200 border-emerald-500/40",
  FAILED:           "bg-red-500/20 text-red-300 border-red-500/40",
};

interface Props {
  hospitalId: string;
  myPatients: Patient[];
  hospitalResourceIds: Set<string>;
}

export function HospitalNegotiationTab({ myPatients, hospitalResourceIds }: Props) {
  const { decisions, resources, activeRound } = useSimulationStore();

  const myPatientIds = new Set(myPatients.map(p => p.id));

  const myDecisions = decisions.filter(d => myPatientIds.has(d.patientId));
  const allocated   = myDecisions.filter(d => d.outcome === "ALLOCATED").length;
  const failed      = myDecisions.filter(d => d.outcome === "FAILED").length;
  const successRate = myDecisions.length > 0
    ? Math.round((allocated / myDecisions.length) * 100) : 0;

  const isActiveForMyPatient = activeRound && myPatientIds.has(activeRound.patientId);

  const myResourceBids = activeRound?.bids.filter(b => hospitalResourceIds.has(b.resourceId)) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Negotiation</h1>
        <p className="text-sm text-slate-400 mt-0.5">Live Contract Net Protocol rounds involving your hospital</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Allocated",    value: allocated,         color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
          { label: "Failed",       value: failed,            color: "text-red-400 bg-red-500/10 border-red-500/30" },
          { label: "Success Rate", value: `${successRate}%`, color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`border rounded-xl p-4 ${color}`}>
            <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Active negotiation */}
        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Live Round</h2>
          {isActiveForMyPatient ? (
            <div className="space-y-3">
              <ActiveNegotiationPanel />
              {myResourceBids.length > 0 && (
                <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Your Hospital&apos;s Bids
                  </h3>
                  <div className="space-y-2">
                    {myResourceBids.map(bid => {
                      const resource = resources.find(r => r.id === bid.resourceId);
                      const isWinner = activeRound!.winningBids.some(wb => wb.id === bid.id);
                      return (
                        <div key={bid.id} className={cn(
                          "flex items-center justify-between px-3 py-2 rounded-lg border text-xs",
                          isWinner
                            ? "border-emerald-500/30 bg-emerald-500/10"
                            : "border-[#1e2d4a] bg-white/5"
                        )}>
                          <div>
                            <p className="font-medium text-white">{resource?.name ?? bid.resourceId}</p>
                            <p className="text-[10px] text-slate-500">conf: {(bid.confidence * 100).toFixed(0)}%</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                              <div
                                className={cn("h-full rounded-full", isWinner ? "bg-emerald-400" : "bg-blue-400")}
                                style={{ width: `${Math.min(100, bid.score)}%` }}
                              />
                            </div>
                            <span className={cn("w-10 text-right font-bold tabular-nums", isWinner ? "text-emerald-400" : "text-blue-300")}>
                              {bid.score.toFixed(1)}
                            </span>
                            {isWinner && <span className="text-[10px] font-bold text-emerald-400">WIN</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-xl p-4">
              {activeRound ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <Clock className="w-8 h-8 text-slate-700" />
                  <div>
                    <p className="text-sm text-slate-400">Active round is for another hospital&apos;s patient</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Phase: <span className={cn("px-1.5 py-0.5 rounded border text-[10px]", PHASE_COLORS[activeRound.phase])}>
                        {activeRound.phase}
                      </span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <Radio className="w-8 h-8 text-slate-700" />
                  <p className="text-sm text-slate-500">No active negotiation round</p>
                  <p className="text-xs text-slate-600">Start the simulation to begin resource allocation</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent decisions for my patients */}
        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Recent Outcomes</h2>
          {myDecisions.length === 0 ? (
            <div className="bg-[#0d1526] border border-dashed border-[#1e2d4a] rounded-xl p-8 text-center">
              <p className="text-sm text-slate-500">No negotiation outcomes yet</p>
              <p className="text-xs text-slate-600 mt-1">Outcomes appear as patients are allocated resources</p>
            </div>
          ) : (
            <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-xl overflow-hidden">
              <div className="divide-y divide-[#1e2d4a]">
                {myDecisions.slice(0, 15).map(d => {
                  const patient = myPatients.find(p => p.id === d.patientId);
                  const allocatedNames = d.allocatedResourceIds
                    .map(id => resources.find(r => r.id === id)?.name)
                    .filter(Boolean);
                  return (
                    <div key={d.id} className="px-4 py-3 flex items-start gap-3">
                      {d.outcome === "ALLOCATED"
                        ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        : <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      }
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-white font-mono">
                            {patient?.mrn ?? d.patientId.slice(0, 10)}
                          </span>
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                            d.outcome === "ALLOCATED"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-red-500/20 text-red-300"
                          )}>{d.outcome}</span>
                        </div>
                        {allocatedNames.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {allocatedNames.map((n, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300">
                                {n}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-[10px] text-slate-600 mt-0.5">
                          {d.decisionTimeMs}ms · {Math.round(d.confidenceScore * 100)}% confidence
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
