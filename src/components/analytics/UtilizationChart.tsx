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
function CustomTooltip(props: any) {
  const { active, payload, label } = props as { active: boolean; payload: { name: string; value: number; color: string }[]; label: string };
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#1e2d4a] bg-[#0d1526] p-3 text-xs shadow-xl">
      <p className="mb-1.5 font-medium text-gray-400">Tick {label as string}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color as string }}
          />
          <span className="text-gray-300">{entry.name}:</span>
          <span className="font-semibold text-white">
            {entry.name === "Utilization"
              ? `${((entry.value as number) * 100).toFixed(1)}%`
              : entry.value as number}
          </span>
        </div>
      ))}
    </div>
  );
}

export function UtilizationChart() {
  const utilizationHistory = useSimulationStore((s) => s.utilizationHistory);

  if (utilizationHistory.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-[#1e2d4a] bg-[#111b2e]">
        <p className="text-sm text-gray-500">Start simulation to see utilization data</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart
        data={utilizationHistory}
        margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="utilGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="availGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" vertical={false} />

        <XAxis
          dataKey="tick"
          tick={{ fill: "#4b5563", fontSize: 10 }}
          axisLine={{ stroke: "#1e2d4a" }}
          tickLine={false}
          label={{
            value: "Tick",
            position: "insideBottomRight",
            offset: -4,
            style: { fill: "#4b5563", fontSize: 10 },
          }}
        />

        <YAxis
          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
          tick={{ fill: "#4b5563", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          domain={[0, 1]}
          width={40}
        />

        <Tooltip content={<CustomTooltip />} />

        <Legend
          wrapperStyle={{ fontSize: 11, color: "#9ca3af", paddingTop: 8 }}
          iconType="circle"
          iconSize={8}
        />

        <Area
          type="monotone"
          dataKey="utilization"
          name="Utilization"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#utilGradient)"
          dot={false}
          activeDot={{ r: 3, fill: "#3b82f6" }}
        />

        <Area
          type="monotone"
          dataKey="availableResources"
          name="Available Resources"
          stroke="#10b981"
          strokeWidth={1.5}
          fill="url(#availGradient)"
          dot={false}
          activeDot={{ r: 3, fill: "#10b981" }}
          // Normalize available resources by dividing by total if needed at render level
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
