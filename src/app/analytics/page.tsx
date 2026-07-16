"use client";

import { useSimulationStore } from "@/lib/store/simulationStore";
import { UtilizationChart } from "@/components/analytics/UtilizationChart";
import { NegotiationOutcomeChart } from "@/components/analytics/NegotiationOutcomeChart";
import {
  TrendingUp,
  Clock,
  Zap,
  Award,
  Activity,
  CheckCircle2,
  XCircle,
  Users,
  BarChart2,
} from "lucide-react";

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  OPERATING_ROOM: "Operating Rooms",
  ICU_BED: "ICU Beds",
  EMERGENCY_BAY: "Emergency Bays",
  VENTILATOR: "Ventilators",
  CT_SCANNER: "CT Scanners",
  SURGEON: "Surgeons",
  ANESTHESIOLOGIST: "Anesthesiologists",
  NURSE_ICU: "ICU Nurses",
  NURSE_ED: "ED Nurses",
  CARDIOLOGIST: "Cardiologists",
  TRAUMA_SURGEON: "Trauma Surgeons",
  DEFIBRILLATOR: "Defibrillators",
  BLOOD_BANK: "Blood Bank",
};

function LiveDot({ running }: { running: boolean }) {
  if (!running) return null;
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
    </span>
  );
}

export default function AnalyticsPage() {
  const { decisions, utilizationHistory, outcomeHistory, resources, patients, status, tick } =
    useSimulationStore();

  const isRunning = status === "RUNNING";

  // ── KPIs ────────────────────────────────────────────────────────────────
  const totalDecisions = decisions.length;
  const allocated = decisions.filter((d) => d.outcome === "ALLOCATED").length;
  const failed = decisions.filter((d) => d.outcome === "FAILED").length;

  const avgDecisionMs =
    totalDecisions > 0
      ? Math.round(decisions.reduce((a, d) => a + d.decisionTimeMs, 0) / totalDecisions)
      : null;

  const successRate = totalDecisions > 0 ? Math.round((allocated / totalDecisions) * 100) : null;

  const occupiedCount = resources.filter((r) => r.status === "OCCUPIED").length;
  const utilPct = resources.length > 0 ? Math.round((occupiedCount / resources.length) * 100) : 0;

  const avgConfidence =
    totalDecisions > 0
      ? Math.round(decisions.reduce((a, d) => a + d.confidenceScore, 0) / totalDecisions)
      : null;

  // ── Patient stats ────────────────────────────────────────────────────────
  const waiting = patients.filter((p) => p.status === "WAITING").length;
  const inNeg = patients.filter((p) => p.status === "IN_NEGOTIATION").length;
  const inTreat = patients.filter((p) => p.status === "ALLOCATED" || p.status === "IN_TREATMENT").length;
  const discharged = patients.filter((p) => p.status === "DISCHARGED").length;

  // ── Resource breakdown by type ───────────────────────────────────────────
  const byType = resources.reduce<
    Record<string, { available: number; occupied: number; maintenance: number; other: number; total: number }>
  >((acc, r) => {
    if (!acc[r.type]) acc[r.type] = { available: 0, occupied: 0, maintenance: 0, other: 0, total: 0 };
    acc[r.type].total++;
    if (r.status === "AVAILABLE") acc[r.type].available++;
    else if (r.status === "OCCUPIED") acc[r.type].occupied++;
    else if (r.status === "MAINTENANCE") acc[r.type].maintenance++;
    else acc[r.type].other++;
    return acc;
  }, {});

  // ── Decision latency buckets ─────────────────────────────────────────────
  const latencyBuckets = [
    { label: "< 10 ms",   count: decisions.filter((d) => d.decisionTimeMs < 10).length },
    { label: "10–50 ms",  count: decisions.filter((d) => d.decisionTimeMs >= 10 && d.decisionTimeMs < 50).length },
    { label: "50–100 ms", count: decisions.filter((d) => d.decisionTimeMs >= 50 && d.decisionTimeMs < 100).length },
    { label: "> 100 ms",  count: decisions.filter((d) => d.decisionTimeMs >= 100).length },
  ];

  // ── Recent decisions (last 8) ────────────────────────────────────────────
  const recentDecisions = decisions.slice(0, 8);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time performance metrics and resource utilization
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
            isRunning
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : status === "PAUSED"
              ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
              : "border-slate-700 bg-slate-800 text-slate-500"
          }`}>
            <LiveDot running={isRunning} />
            {isRunning ? "LIVE" : status === "PAUSED" ? "PAUSED" : "IDLE"}
          </div>
          {tick > 0 && (
            <div className="rounded-lg border border-[#1e2d4a] bg-[#111b2e] px-3 py-1.5 text-xs text-slate-400">
              Tick <span className="font-bold text-white">{tick}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Avg Decision Time"
          value={avgDecisionMs !== null ? `${avgDecisionMs} ms` : "—"}
          sub={totalDecisions > 0 ? `across ${totalDecisions} decisions` : "No decisions yet"}
          icon={Clock}
          colorCls="text-blue-300 border-blue-500/30 bg-blue-500/8"
          live={isRunning}
        />
        <KpiCard
          label="Allocation Success Rate"
          value={successRate !== null ? `${successRate}%` : "—"}
          sub={totalDecisions > 0 ? `${allocated} allocated · ${failed} failed` : "No decisions yet"}
          icon={TrendingUp}
          colorCls={
            successRate !== null && successRate > 80
              ? "text-emerald-300 border-emerald-500/30 bg-emerald-500/8"
              : successRate !== null
              ? "text-amber-300 border-amber-500/30 bg-amber-500/8"
              : "text-slate-400 border-slate-700 bg-slate-800"
          }
          live={isRunning}
        />
        <KpiCard
          label="Resource Utilization"
          value={`${utilPct}%`}
          sub={`${occupiedCount} of ${resources.length} occupied`}
          icon={Zap}
          colorCls={
            utilPct > 80
              ? "text-red-300 border-red-500/30 bg-red-500/8"
              : utilPct > 50
              ? "text-amber-300 border-amber-500/30 bg-amber-500/8"
              : "text-slate-300 border-slate-700 bg-slate-800"
          }
          live={isRunning}
        />
        <KpiCard
          label="Avg Confidence Score"
          value={avgConfidence !== null ? `${avgConfidence}%` : "—"}
          sub="AI decision confidence"
          icon={Award}
          colorCls="text-purple-300 border-purple-500/30 bg-purple-500/8"
          live={isRunning}
        />
      </div>

      {/* ── Patient status strip ── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Waiting",     value: waiting,    cls: "text-amber-400  border-amber-500/20  bg-amber-500/5"  },
          { label: "Negotiating", value: inNeg,      cls: "text-blue-400   border-blue-500/20   bg-blue-500/5"   },
          { label: "In Treatment",value: inTreat,    cls: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" },
          { label: "Discharged",  value: discharged, cls: "text-slate-400  border-slate-700     bg-slate-800"    },
        ].map(({ label, value, cls }) => (
          <div key={label} className={`rounded-xl border p-3 ${cls}`}>
            <p className="text-xs opacity-70 mb-1">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard title="Resource Utilization Over Time" sub="% occupied + active patients per tick" empty={utilizationHistory.length === 0}>
          <UtilizationChart />
        </ChartCard>
        <ChartCard title="Negotiation Outcomes per Tick" sub="Allocated · Failed · Decision latency" empty={outcomeHistory.length === 0}>
          <NegotiationOutcomeChart />
        </ChartCard>
      </div>

      {/* ── Resource type breakdown ── */}
      <div className="rounded-xl border border-[#1e2d4a] bg-[#111b2e] p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="h-4 w-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-300">Resource Availability by Type</h3>
        </div>
        <div className="space-y-3">
          {Object.entries(byType).map(([type, counts]) => {
            const availPct = (counts.available / counts.total) * 100;
            const occupPct = (counts.occupied / counts.total) * 100;
            const maintPct = (counts.maintenance / counts.total) * 100;
            return (
              <div key={type} className="flex items-center gap-3">
                <span className="w-36 shrink-0 text-[11px] text-slate-500 truncate">
                  {RESOURCE_TYPE_LABELS[type] ?? type}
                </span>
                <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-[#1e2d4a]">
                  <div className="bg-emerald-500 transition-all" style={{ width: `${availPct}%` }} />
                  <div className="bg-red-500 transition-all" style={{ width: `${occupPct}%` }} />
                  <div className="bg-amber-500 transition-all" style={{ width: `${maintPct}%` }} />
                </div>
                <div className="flex gap-2 text-[10px] shrink-0 w-36">
                  <span className="text-emerald-400">{counts.available} avail</span>
                  <span className="text-red-400">{counts.occupied} occ</span>
                  {counts.maintenance > 0 && <span className="text-amber-400">{counts.maintenance} maint</span>}
                </div>
              </div>
            );
          })}
          {Object.keys(byType).length === 0 && (
            <p className="text-sm text-slate-600 text-center py-4">No resources loaded</p>
          )}
        </div>
      </div>

      {/* ── Bottom: latency + recent decisions ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Decision latency */}
        <div className="rounded-xl border border-[#1e2d4a] bg-[#111b2e] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-300">Decision Latency Distribution</h3>
          </div>
          {totalDecisions === 0 ? (
            <p className="text-sm text-slate-600 text-center py-6">No decisions yet</p>
          ) : (
            <div className="space-y-3">
              {latencyBuckets.map(({ label, count }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-[11px] text-slate-500">{label}</span>
                  <div className="flex-1 rounded-full bg-[#1e2d4a] h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${totalDecisions > 0 ? (count / totalDecisions) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-[11px] font-semibold text-slate-400">{count}</span>
                </div>
              ))}
              <div className="mt-3 flex justify-between text-[10px] text-slate-600 border-t border-[#1e2d4a] pt-3">
                <span>Fastest: {decisions.length > 0 ? Math.min(...decisions.map(d => d.decisionTimeMs)) : 0} ms</span>
                <span>Slowest: {decisions.length > 0 ? Math.max(...decisions.map(d => d.decisionTimeMs)) : 0} ms</span>
                <span>Total: {totalDecisions} decisions</span>
              </div>
            </div>
          )}
        </div>

        {/* Recent decisions feed */}
        <div className="rounded-xl border border-[#1e2d4a] bg-[#111b2e] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-300">Recent Decisions</h3>
            {isRunning && (
              <span className="ml-auto text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                live
              </span>
            )}
          </div>
          {recentDecisions.length === 0 ? (
            <p className="text-sm text-slate-600 text-center py-6">No decisions yet — start the simulation</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {recentDecisions.map((d) => (
                <div
                  key={d.id}
                  className="flex items-start gap-3 rounded-lg border border-[#1e2d4a] bg-[#080c18] p-2.5"
                >
                  {d.outcome === "ALLOCATED" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[11px] font-semibold ${
                        d.outcome === "ALLOCATED" ? "text-emerald-400" : "text-red-400"
                      }`}>
                        {d.outcome}
                      </span>
                      <span className="text-[10px] text-slate-600 shrink-0">{d.decisionTimeMs} ms</span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5 leading-relaxed">
                      {d.naturalLanguageSummary}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[9px] text-slate-600">
                      <Users className="h-2.5 w-2.5" />
                      {d.allocatedResourceIds.length} resources · confidence {d.confidenceScore}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function KpiCard({
  label, value, sub, icon: Icon, colorCls, live,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  colorCls: string;
  live: boolean;
}) {
  return (
    <div className={`relative rounded-xl border p-4 ${colorCls} overflow-hidden`}>
      {live && (
        <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
      )}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium opacity-75">{label}</span>
        <Icon className="h-4 w-4 opacity-50" />
      </div>
      <p className="text-2xl font-bold tabular-nums mb-1">{value}</p>
      <p className="text-[11px] opacity-55 leading-tight">{sub}</p>
    </div>
  );
}

function ChartCard({
  title, sub, empty, children,
}: {
  title: string;
  sub: string;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#1e2d4a] bg-[#111b2e] p-5">
      <div className="mb-1">
        <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
        <p className="text-[11px] text-slate-600">{sub}</p>
      </div>
      {empty ? (
        <div className="flex h-[220px] flex-col items-center justify-center gap-2 text-slate-600">
          <BarChart2 className="h-8 w-8 opacity-30" />
          <p className="text-sm">Start simulation to see data</p>
          <p className="text-[11px] opacity-60">Press Play in the header</p>
        </div>
      ) : (
        <div className="mt-3">{children}</div>
      )}
    </div>
  );
}
