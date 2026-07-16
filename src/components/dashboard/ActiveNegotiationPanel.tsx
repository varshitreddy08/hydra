"use client";

import { Loader2, Radio } from "lucide-react";
import { useSimulationStore } from "@/lib/store/simulationStore";
import { cn } from "@/lib/utils/cn";
import { formatCondition } from "@/lib/utils/formatters";

const PHASE_COLORS: Record<string, string> = {
  IDLE: "bg-gray-500/20 text-gray-300 border-gray-500/40",
  ANNOUNCEMENT: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  BIDDING: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  EVALUATION: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  DEPENDENCY_CHECK: "bg-orange-500/20 text-orange-300 border-orange-500/40",
  AWARD: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  COMPLETED: "bg-emerald-600/20 text-emerald-200 border-emerald-500/40",
  FAILED: "bg-red-500/20 text-red-300 border-red-500/40",
};

export function ActiveNegotiationPanel() {
  const activeRound = useSimulationStore((s) => s.activeRound);
  const patients = useSimulationStore((s) => s.patients);
  const resources = useSimulationStore((s) => s.resources);

  if (!activeRound) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-[#1e2d4a] bg-[#111b2e] p-8 text-center">
        <Radio className="h-8 w-8 text-gray-600" />
        <p className="text-sm text-gray-500">No active negotiation</p>
        <p className="text-xs text-gray-600">
          Start the simulation to see live negotiation rounds
        </p>
      </div>
    );
  }

  const patient = patients.find((p) => p.id === activeRound.patientId);
  const phaseColor = PHASE_COLORS[activeRound.phase] ?? PHASE_COLORS.IDLE;

  const sortedBids = [...activeRound.bids].sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[#1e2d4a] bg-[#111b2e] p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
          <span className="text-sm font-semibold text-white">Live Negotiation</span>
        </div>
        <span
          className={cn(
            "rounded border px-2 py-0.5 text-xs font-medium tracking-wide",
            phaseColor
          )}
        >
          {activeRound.phase}
        </span>
      </div>

      {patient && (
        <div className="rounded-lg border border-[#1e2d4a] bg-white/5 p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-gray-400">Patient</p>
              <p className="font-mono text-sm font-semibold text-white">{patient.mrn}</p>
              <p className="text-xs text-gray-500">{formatCondition(patient.condition)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Triage Score</p>
              <p className="text-lg font-bold text-amber-400">
                {patient.triageScore.raw.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500">{patient.triageScore.triageLevel}</p>
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium text-gray-400">
            Bids Received ({activeRound.bids.length})
          </p>
          {activeRound.winningBids.length > 0 && (
            <span className="text-xs text-emerald-400">
              {activeRound.winningBids.length} awarded
            </span>
          )}
        </div>

        {sortedBids.length === 0 ? (
          <p className="py-2 text-center text-xs text-gray-600">
            Awaiting bids from resource agents...
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {sortedBids.map((bid) => {
              const resource = resources.find((r) => r.id === bid.resourceId);
              const isWinner = activeRound.winningBids.some((wb) => wb.id === bid.id);

              return (
                <div
                  key={bid.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg border px-3 py-2",
                    isWinner
                      ? "border-emerald-500/30 bg-emerald-500/10"
                      : bid.accepted === false
                      ? "border-red-500/20 bg-red-500/5 opacity-60"
                      : "border-[#1e2d4a] bg-white/5"
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-white">
                      {resource?.name ?? bid.resourceId}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      conf: {(bid.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          isWinner ? "bg-emerald-400" : "bg-blue-400"
                        )}
                        style={{ width: `${Math.min(100, bid.score)}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        "w-10 text-right text-xs font-bold tabular-nums",
                        isWinner ? "text-emerald-400" : "text-blue-300"
                      )}
                    >
                      {bid.score.toFixed(1)}
                    </span>
                    {isWinner && (
                      <span className="text-[10px] font-bold text-emerald-400">WIN</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
