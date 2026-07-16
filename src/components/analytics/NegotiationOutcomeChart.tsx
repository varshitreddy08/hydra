"use client";

import {
  ComposedChart,
  Bar,
  Line,
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
            {entry.name === "Decision ms" ? `${entry.value}ms` : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function NegotiationOutcomeChart() {
  const outcomeHistory = useSimulationStore((s) => s.outcomeHistory);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={outcomeHistory} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" vertical={false} />
        <XAxis
          dataKey="tick"
          tick={{ fill: "#475569", fontSize: 10 }}
          axisLine={{ stroke: "#1e2d4a" }}
          tickLine={false}
        />
        {/* Left: count of allocated/failed */}
        <YAxis
          yAxisId="count"
          allowDecimals={false}
          tick={{ fill: "#475569", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={24}
        />
        {/* Right: decision latency ms */}
        <YAxis
          yAxisId="ms"
          orientation="right"
          tick={{ fill: "#475569", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={36}
          tickFormatter={(v) => `${v}ms`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: "#94a3b8", paddingTop: 8 }}
          iconType="circle"
          iconSize={7}
        />
        <Bar
          yAxisId="count"
          dataKey="allocated"
          name="Allocated"
          fill="#10b981"
          radius={[3, 3, 0, 0]}
          maxBarSize={20}
          isAnimationActive={false}
        />
        <Bar
          yAxisId="count"
          dataKey="failed"
          name="Failed"
          fill="#ef4444"
          radius={[3, 3, 0, 0]}
          maxBarSize={20}
          isAnimationActive={false}
        />
        <Line
          yAxisId="ms"
          type="monotone"
          dataKey="avgDecisionMs"
          name="Decision ms"
          stroke="#f59e0b"
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3 }}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
