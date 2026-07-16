"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useSimulationStore } from "@/lib/store/simulationStore";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#1e2d4a] bg-[#0d1526] p-3 text-xs shadow-xl">
      <p className="mb-2 font-semibold text-slate-400">Tick {label}</p>
      {payload.map((entry: { name: string; value: number; color: string }) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1 last:mb-0">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: entry.color }} />
          <span className="text-slate-400">{entry.name}:</span>
          <span className="font-bold text-white">
            {entry.name === "Utilization %"
              ? `${(entry.value * 100).toFixed(1)}%`
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function UtilizationChart() {
  const utilizationHistory = useSimulationStore((s) => s.utilizationHistory);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={utilizationHistory} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="utilGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="patGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" vertical={false} />
        <XAxis
          dataKey="tick"
          tick={{ fill: "#475569", fontSize: 10 }}
          axisLine={{ stroke: "#1e2d4a" }}
          tickLine={false}
        />
        {/* Left Y: utilization 0–1 */}
        <YAxis
          yAxisId="util"
          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
          tick={{ fill: "#475569", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          domain={[0, 1]}
          width={38}
        />
        {/* Right Y: active patients */}
        <YAxis
          yAxisId="pat"
          orientation="right"
          allowDecimals={false}
          tick={{ fill: "#475569", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: "#94a3b8", paddingTop: 8 }}
          iconType="circle"
          iconSize={7}
        />
        <Area
          yAxisId="util"
          type="monotone"
          dataKey="utilization"
          name="Utilization %"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#utilGrad)"
          dot={false}
          activeDot={{ r: 3, fill: "#3b82f6" }}
          isAnimationActive={false}
        />
        <Area
          yAxisId="pat"
          type="monotone"
          dataKey="activePatients"
          name="Active Patients"
          stroke="#a78bfa"
          strokeWidth={1.5}
          fill="url(#patGrad)"
          dot={false}
          activeDot={{ r: 3, fill: "#a78bfa" }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
