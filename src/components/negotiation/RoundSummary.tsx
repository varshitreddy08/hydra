"use client";

import { useSimulationStore } from "@/lib/store/simulationStore";
import { formatMs } from "@/lib/utils/formatters";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

export function RoundSummary() {
  const { rounds } = useSimulationStore();
  const recentRounds = rounds.slice(0, 8);

  if (recentRounds.length === 0) {
    return (
      <div className="text-center py-8 text-slate-600 text-sm">
        No rounds completed yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {recentRounds.map((round) => (
        <div
          key={round.id}
          className="bg-[#0d1526] border border-[#1e2d4a] rounded-lg px-3 py-2 flex items-center gap-3"
        >
          {round.phase === "COMPLETED" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : round.phase === "FAILED" ? (
            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">
                {round.id.slice(0, 12)}…
              </span>
              <span
                className={`text-xs font-medium ${
                  round.phase === "COMPLETED"
                    ? "text-emerald-400"
                    : round.phase === "FAILED"
                    ? "text-red-400"
                    : "text-amber-400"
                }`}
              >
                {round.phase}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
              <span>{round.bids.length} bids</span>
              <span>{round.winningBids.length} allocated</span>
              {round.durationMs !== null && (
                <span>{formatMs(round.durationMs)}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
