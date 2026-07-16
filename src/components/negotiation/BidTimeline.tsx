"use client";

import { useSimulationStore } from "@/lib/store/simulationStore";
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

export function BidTimeline() {
  const { rounds } = useSimulationStore();

  // Build chart data: per round, show max winning bid score and max losing bid score
  const data = rounds
    .slice(0, 20)
    .reverse()
    .map((r, i) => {
      const winningScores = r.winningBids.map((b) => b.score);
      const losingScores = r.bids
        .filter((b) => !b.accepted)
        .map((b) => b.score);
      return {
        round: i + 1,
        winningScore: winningScores.length > 0 ? Math.max(...winningScores) : 0,
        avgScore:
          r.bids.length > 0
            ? r.bids.reduce((a, b) => a + b.score, 0) / r.bids.length
            : 0,
        totalBids: r.bids.length,
      };
    });

  if (data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-slate-600 text-sm">
        No rounds yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="winGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
        <XAxis
          dataKey="round"
          tick={{ fill: "#475569", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          label={{ value: "Round", position: "insideBottom", offset: -3, fill: "#475569", fontSize: 10 }}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: "#475569", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "#0d1526",
            border: "1px solid #1e2d4a",
            borderRadius: "8px",
            fontSize: "11px",
            color: "#e2e8f0",
          }}
          itemStyle={{ color: "#94a3b8" }}
        />
        <Legend
          wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }}
        />
        <Area
          type="monotone"
          dataKey="winningScore"
          name="Winning Score"
          stroke="#10b981"
          fill="url(#winGrad)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="avgScore"
          name="Avg Score"
          stroke="#3b82f6"
          fill="url(#avgGrad)"
          strokeWidth={1.5}
          strokeDasharray="4 2"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
