"use client";

import { useSimulationStore } from "@/lib/store/simulationStore";
import { KPICards } from "@/components/dashboard/KPICards";
import { ResourceStatusGrid } from "@/components/dashboard/ResourceStatusGrid";
import { SystemHealthBar } from "@/components/dashboard/SystemHealthBar";
import { ActiveNegotiationPanel } from "@/components/dashboard/ActiveNegotiationPanel";
import { HospitalStaffPanel } from "@/components/dashboard/HospitalStaffPanel";

export default function DashboardPage() {
  const { status, patients, decisions } = useSimulationStore();

  const waitingCount = patients.filter((p) => p.status === "WAITING").length;
  const criticalCount = patients.filter(
    (p) =>
      p.status === "WAITING" && p.triageScore.triageLevel === "P1_IMMEDIATE"
  ).length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Operations Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time hospital resource allocation overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          {criticalCount > 0 && (
            <div className="px-3 py-1.5 bg-red-500/10 border border-red-500/40 rounded-lg text-xs font-medium text-red-300 animate-pulse">
              ⚠ {criticalCount} P1 Critical Waiting
            </div>
          )}
          {waitingCount > 0 && (
            <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs font-medium text-amber-300">
              {waitingCount} in Queue
            </div>
          )}
        </div>
      </div>

      {/* System health bar */}
      <SystemHealthBar />

      {/* KPI cards */}
      <KPICards />

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Resource grid - takes 2 cols */}
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-300">
              Resource Status
            </h2>
            <span className="text-xs text-slate-500">
              {status === "RUNNING" ? "Live" : "Paused"}
            </span>
          </div>
          <ResourceStatusGrid />
        </div>

        {/* Active negotiation panel */}
        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-4">
            Active Negotiation
          </h2>
          <ActiveNegotiationPanel />
        </div>
      </div>

      {/* Recent decisions mini-list */}
      {decisions.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-3">
            Recent Decisions
          </h2>
          <div className="space-y-2">
            {decisions.slice(0, 5).map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between bg-[#111b2e] border border-[#1e2d4a] rounded-lg px-4 py-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded-full font-medium ${
                      d.outcome === "ALLOCATED"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-red-500/20 text-red-300"
                    }`}
                  >
                    {d.outcome}
                  </span>
                  <span className="text-slate-400 font-mono">
                    {d.patientId.slice(0, 8)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-slate-500">
                  <span>{d.decisionTimeMs}ms</span>
                  <span className="font-mono text-xs">
                    {d.auditHash.slice(0, 12)}…
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {status === "IDLE" && (
        <div className="text-center py-12 text-slate-500">
          <p className="text-sm">
            Click{" "}
            <span className="text-emerald-400 font-medium">
              Start Simulation
            </span>{" "}
            in the toolbar to begin the multi-agent negotiation.
          </p>
        </div>
      )}

      {/* Hospital Staff Management — view/assign only for admin */}
      <HospitalStaffPanel canCreate={false} />
    </div>
  );
}
