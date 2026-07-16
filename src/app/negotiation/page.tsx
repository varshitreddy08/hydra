"use client";

import { useState } from "react";
import { useSimulationStore } from "@/lib/store/simulationStore";
import dynamic from "next/dynamic";
import { BidTimeline } from "@/components/negotiation/BidTimeline";
import { RoundSummary } from "@/components/negotiation/RoundSummary";
import {
  GitBranch,
  Play,
  Pause,
  Zap,
  Users,
  CheckCircle2,
  Clock,
  Radio,
  Award,
  Search,
  BarChart3,
} from "lucide-react";

const NegotiationGraph = dynamic(
  () => import("@/components/negotiation/NegotiationGraph").then((m) => m.NegotiationGraph),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center text-slate-600 text-sm">
        Loading graph…
      </div>
    ),
  }
);

const CNP_PHASES = [
  {
    icon: Radio,
    phase: "Announcement",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    desc: "Patient requirements broadcast to all resource agents",
  },
  {
    icon: Zap,
    phase: "Bidding",
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
    desc: "Each available agent submits a bid with a score",
  },
  {
    icon: Search,
    phase: "Evaluation",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    desc: "Bids ranked by score, dependencies verified",
  },
  {
    icon: Award,
    phase: "Award",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    desc: "Best-matched resources allocated to the patient",
  },
];

function EmptyState({ onStart }: { onStart: () => void }) {
  const { agents, resources } = useSimulationStore();
  const idle = agents.filter((a) => a.state === "IDLE").length;
  const busy = agents.filter((a) => a.state === "ALLOCATED" || a.state === "BIDDING").length;

  return (
    <div className="flex flex-col gap-6">
      {/* Explainer */}
      <div className="rounded-2xl border border-[#1e2d4a] bg-[#0d1526] p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
            <GitBranch className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white mb-1">What is this page?</h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
              Every time a patient needs care, the system runs a{" "}
              <span className="text-blue-300 font-medium">Contract Net Protocol (CNP)</span>{" "}
              negotiation — a multi-agent auction where resource agents (beds, surgeons, equipment)
              compete to serve the patient. This page visualizes those auctions in real time:
              which agents bid, their scores, who won, and why.
            </p>
          </div>
        </div>

        {/* CNP phase flow */}
        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {CNP_PHASES.map(({ icon: Icon, phase, color, bg, desc }, i) => (
            <div key={phase} className={`relative rounded-xl border p-3 ${bg}`}>
              {i < CNP_PHASES.length - 1 && (
                <span className="absolute -right-1.5 top-1/2 -translate-y-1/2 z-10 text-slate-700 text-xs hidden lg:block">
                  →
                </span>
              )}
              <Icon className={`h-4 w-4 mb-2 ${color}`} />
              <p className={`text-xs font-bold mb-1 ${color}`}>{phase}</p>
              <p className="text-[10px] text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Agent readiness */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#1e2d4a] bg-[#111b2e] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-400">Total Agents</span>
          </div>
          <p className="text-2xl font-bold text-white">{agents.length}</p>
          <p className="text-[10px] text-slate-600 mt-0.5">resource agents registered</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400">Ready to Bid</span>
          </div>
          <p className="text-2xl font-bold text-white">{idle}</p>
          <p className="text-[10px] text-slate-600 mt-0.5">agents idle & available</p>
        </div>
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-semibold text-blue-400">Resources</span>
          </div>
          <p className="text-2xl font-bold text-white">{resources.filter((r) => r.status === "AVAILABLE").length}</p>
          <p className="text-[10px] text-slate-600 mt-0.5">resources available for allocation</p>
        </div>
      </div>

      {/* Start CTA */}
      <div className="rounded-2xl border border-dashed border-[#1e2d4a] bg-[#080c18] p-8 text-center">
        <BarChart3 className="h-10 w-10 text-slate-700 mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-400 mb-1">No negotiation rounds yet</p>
        <p className="text-xs text-slate-600 mb-4">
          Start the simulation from the Dashboard and watch live auctions appear here — the graph,
          bid scores, and round history all update in real time.
        </p>
        <button
          onClick={onStart}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors active:scale-[.98]"
        >
          <Play className="h-4 w-4" />
          Start Simulation
        </button>
      </div>
    </div>
  );
}

export default function NegotiationPage() {
  const { activeRound, rounds, decisions, status, start, pause } = useSimulationStore();
  const [selectedDecisionId] = useState<string | null>(null);

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
  const currentPhaseIdx = displayRound ? cnpPhases.indexOf(displayRound.phase) : -1;

  const hasRounds = rounds.length > 0 || activeRound !== null;

  function handleStart() {
    if (status === "RUNNING") {
      pause();
    } else {
      start();
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Live Negotiation Visualization</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Contract Net Protocol — real-time agent bidding network
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Simulation toggle */}
          <button
            onClick={handleStart}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              status === "RUNNING"
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-blue-600 hover:bg-blue-500 text-white"
            }`}
          >
            {status === "RUNNING" ? (
              <>
                <Pause className="h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                {status === "PAUSED" ? "Resume" : "Start"}
              </>
            )}
          </button>

          {/* Phase indicator — only when rounds exist */}
          {hasRounds && displayRound && (
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
                  {phase.split("_")[0]}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Live status bar */}
      {status === "RUNNING" && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-400">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Simulation running — negotiation rounds are live. The graph updates automatically every 4 seconds.
        </div>
      )}

      {/* Main content */}
      {!hasRounds ? (
        <EmptyState onStart={handleStart} />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Graph */}
          <div
            className="xl:col-span-2 bg-[#0d1526] border border-[#1e2d4a] rounded-xl overflow-hidden"
            style={{ minHeight: 420 }}
          >
            <NegotiationGraph />
          </div>

          {/* Right panel */}
          <div className="flex flex-col gap-4">
            <div className="bg-[#111b2e] border border-[#1e2d4a] rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                Recent Rounds
              </h3>
              <RoundSummary />
            </div>

            <div className="bg-[#111b2e] border border-[#1e2d4a] rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">
                Bid Score History
              </h3>
              <BidTimeline />
            </div>
          </div>

          {/* Decision explainability */}
          {selectedDecision && (
            <div className="xl:col-span-3 bg-[#111b2e] border border-[#1e2d4a] rounded-xl p-4">
              <p className="text-sm font-semibold text-slate-300 mb-2">
                Latest Decision — AI Reasoning
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                {selectedDecision.naturalLanguageSummary}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
