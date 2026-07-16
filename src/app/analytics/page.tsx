"use client";

import { useSimulationStore } from "@/lib/store/simulationStore";
import { UtilizationChart } from "@/components/analytics/UtilizationChart";
import { NegotiationOutcomeChart } from "@/components/analytics/NegotiationOutcomeChart";
import { TrendingUp, TrendingDown, Clock, Zap } from "lucide-react";

export default function AnalyticsPage() {
  const { decisions, utilizationHistory, outcomeHistory, resources } =
    useSimulationStore();

  const avgDecisionMs =
    decisions.length > 0
      ? Math.round(
          decisions.reduce((a, d) => a + d.decisionTimeMs, 0) / decisions.length
        )
      : 0;

  const successRate =
    decisions.length > 0
      ? Math.round(
          (decisions.filter((d) => d.outcome === "ALLOCATED").length /
            decisions.length) *
            100
        )
      : 0;

  const currentUtil =
    utilizationHistory.length > 0
      ? utilizationHistory[utilizationHistory.length - 1].utilization
      : 0;

  const avgConfidence =
    decisions.length > 0
      ? Math.round(
          decisions.reduce((a, d) => a + d.confidenceScore, 0) /
            decisions.length
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Analytics</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Historical performance metrics and resource utilization trends
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Avg Decision Time",
            value: `${avgDecisionMs}ms`,
            icon: Clock,
            sub: "per negotiation round",
            color: "text-blue-300 bg-blue-500/10 border-blue-500/30",
          },
          {
            label: "Allocation Success Rate",
            value: `${successRate}%`,
            icon: TrendingUp,
            sub: `${decisions.filter((d) => d.outcome === "ALLOCATED").length} of ${decisions.length}`,
            color:
              successRate > 80
                ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/30"
                : "text-amber-300 bg-amber-500/10 border-amber-500/30",
          },
          {
            label: "Resource Utilization",
            value: `${Math.round(currentUtil * 100)}%`,
            icon: Zap,
            sub: `${resources.filter((r) => r.status === "OCCUPIED").length}/${resources.length} occupied`,
            color:
              currentUtil > 0.8
                ? "text-red-300 bg-red-500/10 border-red-500/30"
                : "text-slate-300 bg-slate-800 border-slate-700",
          },
          {
            label: "Avg Confidence Score",
            value: `${avgConfidence}%`,
            icon: TrendingDown,
            sub: "decision confidence",
            color: "text-purple-300 bg-purple-500/10 border-purple-500/30",
          },
        ].map(({ label, value, icon: Icon, sub, color }) => (
          <div key={label} className={`border rounded-xl p-4 ${color}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium opacity-80">{label}</span>
              <Icon className="w-4 h-4 opacity-60" />
            </div>
            <p className="text-2xl font-bold mb-1">{value}</p>
            <p className="text-xs opacity-60">{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-[#111b2e] border border-[#1e2d4a] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">
            Resource Utilization Over Time
          </h3>
          {utilizationHistory.length > 0 ? (
            <UtilizationChart />
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-600 text-sm">
              Start simulation to see data
            </div>
          )}
        </div>

        <div className="bg-[#111b2e] border border-[#1e2d4a] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">
            Negotiation Outcomes per Tick
          </h3>
          {outcomeHistory.length > 0 ? (
            <NegotiationOutcomeChart />
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-600 text-sm">
              Start simulation to see data
            </div>
          )}
        </div>
      </div>

      {/* Decision latency table */}
      {decisions.length > 0 && (
        <div className="bg-[#111b2e] border border-[#1e2d4a] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">
            Decision Latency Distribution
          </h3>
          <div className="space-y-2">
            {[
              { label: "< 10ms", count: decisions.filter((d) => d.decisionTimeMs < 10).length },
              { label: "10–50ms", count: decisions.filter((d) => d.decisionTimeMs >= 10 && d.decisionTimeMs < 50).length },
              { label: "50–100ms", count: decisions.filter((d) => d.decisionTimeMs >= 50 && d.decisionTimeMs < 100).length },
              { label: "> 100ms", count: decisions.filter((d) => d.decisionTimeMs >= 100).length },
            ].map(({ label, count }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-16">{label}</span>
                <div className="flex-1 bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{
                      width:
                        decisions.length > 0
                          ? `${(count / decisions.length) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
