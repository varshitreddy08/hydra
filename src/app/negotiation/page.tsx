"use client";

import { useState } from "react";
import { useSimulationStore } from "@/lib/store/simulationStore";
import dynamic from "next/dynamic";
import { BidTimeline } from "@/components/negotiation/BidTimeline";
import { RoundSummary } from "@/components/negotiation/RoundSummary";
import { ReasoningTree } from "@/components/decisions/ReasoningTree";
import { GitBranch, Info } from "lucide-react";

// Dynamic import to avoid SSR issues with @xyflow/react
const NegotiationGraph = dynamic(
  () => import("@/components/negotiation/NegotiationGraph").then((m) => m.NegotiationGraph),
  { ssr: false, loading: () => (
    <div className="h-full flex items-center justify-center text-slate-600 text-sm">
      Loading graph…
    </div>
  )}
);

export default function NegotiationPage() {
  const { activeRound, rounds, decisions } = useSimulationStore();
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);

  const selectedDecision = selectedDecisionId
    ? decisions.find((d) => d.id === selectedDecisionId)
    : decisions[0] ?? null;

  const displayRound = activeRound ?? rounds[0] ?? null;

  const cnpPhases = [
    "ANNOUNCEMENT",
    "BIDDING",
    "EVALUATION",
    "DEPENDENCY_CHECK",
    "AWARD",
    "COMPLETED",
  ];

  const currentPhaseIdx = displayRound
    ? cnpPhases.indexOf(displayRound.phase)
    : -1;

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">
            Live Negotiation Visualization
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Contract Net Protocol — real-time agent bidding network
          </p>
        </div>

        {/* Phase indicator */}
        {displayRound && (
          <div className="hidden lg:flex items-center gap-1">
            {cnpPhases.map((phase, i) => (
              <div
                key={phase}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  i === currentPhaseIdx
                    ? "bg-blue-600 text-white"
                    : i < currentPhaseIdx
                    ? "bg-emerald-900/40 text-emerald-500"
                    : "bg-[#111b2e] text-slate-600"
                }`}
              >
                {phase.split("_").slice(0, 1)[0]}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main layout */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-4 min-h-0">
        {/* Graph - takes 2 cols */}
        <div className="xl:col-span-2 bg-[#0d1526] border border-[#1e2d4a] rounded-xl overflow-hidden" style={{ minHeight: "400px" }}>
          <NegotiationGraph />
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-4 min-h-0 overflow-auto">
          {/* Round summary */}
          <div className="bg-[#111b2e] border border-[#1e2d4a] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              Recent Rounds
            </h3>
            <RoundSummary />
          </div>

          {/* Bid score timeline */}
          <div className="bg-[#111b2e] border border-[#1e2d4a] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">
              Bid Score History
            </h3>
            <BidTimeline />
          </div>
        </div>
      </div>

      {/* Explainability panel */}
      {selectedDecision && (
        <div className="bg-[#111b2e] border border-[#1e2d4a] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-300">
              Decision Explainability —{" "}
              <span className="font-mono text-xs text-slate-500">
                {selectedDecision.id.slice(0, 16)}…
              </span>
            </h3>
          </div>
          <ReasoningTree
            factors={selectedDecision.reasoningFactors}
            summary={selectedDecision.naturalLanguageSummary}
          />
        </div>
      )}
    </div>
  );
}
