"use client";

import {
  BarChart, Bar, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useSimulationStore } from "@/lib/store/simulationStore";
import type { Patient, Resource } from "@/types";

interface Props {
  hospitalId: string;
  myPatients: Patient[];
  hospitalResources: Resource[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#1e2d4a] bg-[#0d1526] p-3 text-xs shadow-xl">
      <p className="mb-2 font-semibold text-slate-400">Tick {label}</p>
      {payload.map((e: { name: string; value: number; color: string }) => (
        <div key={e.name} className="flex items-center gap-2 mb-1 last:mb-0">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: e.color }} />
          <span className="text-slate-400">{e.name}:</span>
          <span className="font-bold text-white">{e.value}</span>
        </div>
      ))}
    </div>
  );
}

export function HospitalAnalyticsTab({ myPatients, hospitalResources }: Props) {
  const { decisions, utilizationHistory } = useSimulationStore();

  const myPatientIds = new Set(myPatients.map(p => p.id));
  const myDecisions  = decisions.filter(d => myPatientIds.has(d.patientId));

  const allocated    = myDecisions.filter(d => d.outcome === "ALLOCATED").length;
  const failed       = myDecisions.filter(d => d.outcome === "FAILED").length;
  const successRate  = myDecisions.length > 0 ? Math.round((allocated / myDecisions.length) * 100) : 0;
  const avgMs        = myDecisions.length > 0
    ? Math.round(myDecisions.reduce((s, d) => s + d.decisionTimeMs, 0) / myDecisions.length) : 0;

  const availableRes  = hospitalResources.filter(r => r.status === "AVAILABLE").length;
  const occupiedRes   = hospitalResources.filter(r => r.status === "OCCUPIED").length;
  const utilPct       = hospitalResources.length > 0
    ? Math.round((occupiedRes / hospitalResources.length) * 100) : 0;

  // Triage breakdown
  const triageCounts = myPatients.reduce<Record<string, number>>((acc, p) => {
    acc[p.triageScore.triageLevel] = (acc[p.triageScore.triageLevel] ?? 0) + 1;
    return acc;
  }, {});
  const triageData = [
    { name: "P1", value: triageCounts["P1_IMMEDIATE"]   ?? 0, fill: "#ef4444" },
    { name: "P2", value: triageCounts["P2_EMERGENT"]    ?? 0, fill: "#f97316" },
    { name: "P3", value: triageCounts["P3_URGENT"]      ?? 0, fill: "#f59e0b" },
    { name: "P4", value: triageCounts["P4_LESS_URGENT"] ?? 0, fill: "#3b82f6" },
    { name: "P5", value: triageCounts["P5_NON_URGENT"]  ?? 0, fill: "#64748b" },
  ];

  // Resource type breakdown
  const typeMap = hospitalResources.reduce<Record<string, { available: number; occupied: number }>>((acc, r) => {
    const key = r.type.replace(/_/g, " ");
    if (!acc[key]) acc[key] = { available: 0, occupied: 0 };
    if (r.status === "AVAILABLE") acc[key].available++;
    else if (r.status === "OCCUPIED") acc[key].occupied++;
    return acc;
  }, {});
  const resourceTypeData = Object.entries(typeMap).map(([name, v]) => ({ name, ...v }));

  // Outcome history for this hospital's patients (derived from decisions per tick)
  const outcomeByTick = myDecisions.slice(-20).reduce<
    { tick: number; allocated: number; failed: number }[]
  >((acc, d) => {
    const tick = Math.floor(d.decidedAt / 5000);
    const found = acc.find(a => a.tick === tick);
    if (found) {
      if (d.outcome === "ALLOCATED") found.allocated++;
      else found.failed++;
    } else {
      acc.push({ tick, allocated: d.outcome === "ALLOCATED" ? 1 : 0, failed: d.outcome === "FAILED" ? 1 : 0 });
    }
    return acc;
  }, []).sort((a, b) => a.tick - b.tick);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Analytics</h1>
        <p className="text-sm text-slate-400 mt-0.5">Performance metrics for your hospital</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Success Rate",    value: `${successRate}%`, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
          { label: "Allocated",       value: allocated,          color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
          { label: "Failed",          value: failed,             color: "text-red-400 bg-red-500/10 border-red-500/30" },
          { label: "Avg Decision",    value: `${avgMs}ms`,       color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`border rounded-xl p-4 ${color}`}>
            <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Resource utilisation + System history */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Hospital resource util */}
        <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-300">Resource Utilisation</h2>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              utilPct > 80 ? "bg-red-500/20 text-red-300" :
              utilPct > 60 ? "bg-amber-500/20 text-amber-300" :
              "bg-emerald-500/20 text-emerald-300"
            }`}>{utilPct}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
            <div
              className={`h-full rounded-full transition-all ${
                utilPct > 80 ? "bg-red-400" : utilPct > 60 ? "bg-amber-400" : "bg-emerald-400"
              }`}
              style={{ width: `${utilPct}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-xs pt-2">
            {[
              { label: "Available", value: availableRes, cls: "text-emerald-400" },
              { label: "Occupied",  value: occupiedRes,  cls: "text-red-400" },
              { label: "Total",     value: hospitalResources.length, cls: "text-white" },
            ].map(({ label, value, cls }) => (
              <div key={label}>
                <p className={`text-lg font-bold ${cls}`}>{value}</p>
                <p className="text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* System-wide utilization history */}
        <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">System Utilisation Trend</h2>
          {utilizationHistory.length === 0 ? (
            <div className="flex items-center justify-center h-[140px] text-slate-600 text-sm">
              No data yet — start the simulation
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={utilizationHistory} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="hUtilGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" vertical={false} />
                <XAxis dataKey="tick" tick={{ fill: "#475569", fontSize: 9 }} axisLine={{ stroke: "#1e2d4a" }} tickLine={false} />
                <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fill: "#475569", fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, 1]} width={36} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="utilization" name="Util %" stroke="#3b82f6" strokeWidth={2} fill="url(#hUtilGrad)" dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Triage breakdown + Resource type breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Triage distribution */}
        <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Patient Triage Distribution</h2>
          {myPatients.length === 0 ? (
            <div className="flex items-center justify-center h-[160px] text-slate-600 text-sm">No patients</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={triageData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 10 }} axisLine={{ stroke: "#1e2d4a" }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="value" name="Patients" radius={[3, 3, 0, 0]} maxBarSize={32} isAnimationActive={false}>
                  {triageData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Outcome history */}
        <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Allocation Outcomes Over Time</h2>
          {outcomeByTick.length === 0 ? (
            <div className="flex items-center justify-center h-[160px] text-slate-600 text-sm">No decisions yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={outcomeByTick} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" vertical={false} />
                <XAxis dataKey="tick" tick={{ fill: "#475569", fontSize: 9 }} axisLine={{ stroke: "#1e2d4a" }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "#475569", fontSize: 9 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8", paddingTop: 8 }} iconType="circle" iconSize={7} />
                <Bar dataKey="allocated" name="Allocated" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={20} isAnimationActive={false} />
                <Bar dataKey="failed"    name="Failed"    fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={20} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Resource type breakdown table */}
      {resourceTypeData.length > 0 && (
        <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1e2d4a]">
            <h2 className="text-sm font-semibold text-slate-300">Resources by Type</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1e2d4a] text-slate-500">
                  <th className="text-left px-4 py-2.5 font-medium">Type</th>
                  <th className="text-left px-4 py-2.5 font-medium">Available</th>
                  <th className="text-left px-4 py-2.5 font-medium">Occupied</th>
                  <th className="text-left px-4 py-2.5 font-medium">Utilisation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2d4a]">
                {resourceTypeData.map(({ name, available, occupied }) => {
                  const total = available + occupied;
                  const pct   = total > 0 ? Math.round((occupied / total) * 100) : 0;
                  return (
                    <tr key={name} className="hover:bg-[#111b2e] transition-colors">
                      <td className="px-4 py-3 text-slate-300 font-medium capitalize">{name.toLowerCase()}</td>
                      <td className="px-4 py-3 text-emerald-400">{available}</td>
                      <td className="px-4 py-3 text-red-400">{occupied}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${pct > 80 ? "bg-red-400" : pct > 60 ? "bg-amber-400" : "bg-emerald-400"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-slate-400">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
