"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
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
          <span className="font-semibold text-white">{entry.value as number}</span>
        </div>
      ))}
    </div>
  );
}

export function NegotiationOutcomeChart() {
  const outcomeHistory = useSimulationStore((s) => s.outcomeHistory);

  if (outcomeHistory.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-[#1e2d4a] bg-[#111b2e]">
        <p className="text-sm text-gray-500">Start simulation to see negotiation outcomes</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={outcomeHistory}
        margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
        barCategoryGap="30%"
        barGap={2}
      >
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
          allowDecimals={false}
          tick={{ fill: "#4b5563", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={24}
        />

        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />

        <Legend
          wrapperStyle={{ fontSize: 11, color: "#9ca3af", paddingTop: 8 }}
          iconType="circle"
          iconSize={8}
        />

        <Bar
          dataKey="allocated"
          name="Allocated"
          fill="#10b981"
          radius={[3, 3, 0, 0]}
          maxBarSize={24}
        />
        <Bar
          dataKey="failed"
          name="Failed"
          fill="#ef4444"
          radius={[3, 3, 0, 0]}
          maxBarSize={24}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
