"use client";

import { useSimulationStore } from "@/lib/store/simulationStore";
import { Play, Pause, RotateCcw, AlertTriangle, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Header() {
  const { status, tick, start, pause, reset, patients } = useSimulationStore();
  const criticalPatients = patients.filter(
    (p) => p.status === "WAITING" && p.triageScore.triageLevel === "P1_IMMEDIATE"
  );

  return (
    <header className="h-14 bg-[#0d1526] border-b border-[#1e2d4a] flex items-center justify-between px-4 shrink-0">
      {/* Left: simulation controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {status === "RUNNING" ? (
            <button
              onClick={pause}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-medium hover:bg-amber-500/20 transition-colors"
            >
              <Pause className="w-3.5 h-3.5" />
              Pause
            </button>
          ) : (
            <button
              onClick={start}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/20 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              {status === "IDLE" ? "Start Simulation" : "Resume"}
            </button>
          )}
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-400 rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        {/* Tick counter */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#111b2e] border border-[#1e2d4a] rounded-lg">
          <div
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              status === "RUNNING"
                ? "bg-emerald-400 animate-pulse"
                : status === "PAUSED"
                ? "bg-amber-400"
                : "bg-slate-600"
            )}
          />
          <span className="text-xs text-slate-400 font-mono">
            {status === "IDLE" ? "IDLE" : `T-${tick}`}
          </span>
        </div>
      </div>

      {/* Right: alerts + status */}
      <div className="flex items-center gap-3">
        {criticalPatients.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs text-red-300 font-medium">
              {criticalPatients.length} CRITICAL
            </span>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          {status === "RUNNING" ? (
            <Wifi className="w-4 h-4 text-emerald-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-slate-600" />
          )}
          <span
            className={cn(
              "text-xs font-medium",
              status === "RUNNING"
                ? "text-emerald-400"
                : status === "PAUSED"
                ? "text-amber-400"
                : "text-slate-600"
            )}
          >
            {status}
          </span>
        </div>
      </div>
    </header>
  );
}
