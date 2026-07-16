"use client";

import { useSimulationStore } from "@/lib/store/simulationStore";
import { cn } from "@/lib/utils/cn";

interface Segment {
  label: string;
  key: string;
  color: string;
  textColor: string;
  count: number;
  pct: number;
}

export function SystemHealthBar() {
  const resources = useSimulationStore((s) => s.resources);
  const total = resources.length;

  const counts = {
    AVAILABLE: resources.filter((r) => r.status === "AVAILABLE").length,
    OCCUPIED: resources.filter((r) => r.status === "OCCUPIED").length,
    MAINTENANCE: resources.filter((r) => r.status === "MAINTENANCE").length,
    OFFLINE: resources.filter((r) => r.status === "OFFLINE").length,
    RESERVED: resources.filter((r) => r.status === "RESERVED").length,
  };

  const segments: Segment[] = [
    {
      label: "Available",
      key: "AVAILABLE",
      color: "bg-emerald-500",
      textColor: "text-emerald-400",
      count: counts.AVAILABLE,
      pct: total > 0 ? (counts.AVAILABLE / total) * 100 : 0,
    },
    {
      label: "Occupied",
      key: "OCCUPIED",
      color: "bg-red-500",
      textColor: "text-red-400",
      count: counts.OCCUPIED,
      pct: total > 0 ? (counts.OCCUPIED / total) * 100 : 0,
    },
    {
      label: "Reserved",
      key: "RESERVED",
      color: "bg-amber-400",
      textColor: "text-amber-400",
      count: counts.RESERVED,
      pct: total > 0 ? (counts.RESERVED / total) * 100 : 0,
    },
    {
      label: "Maintenance",
      key: "MAINTENANCE",
      color: "bg-orange-500",
      textColor: "text-orange-400",
      count: counts.MAINTENANCE,
      pct: total > 0 ? (counts.MAINTENANCE / total) * 100 : 0,
    },
    {
      label: "Offline",
      key: "OFFLINE",
      color: "bg-gray-600",
      textColor: "text-gray-400",
      count: counts.OFFLINE,
      pct: total > 0 ? (counts.OFFLINE / total) * 100 : 0,
    },
  ].filter((s) => s.count > 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end justify-between gap-1">
        {segments.map((seg) => (
          <div
            key={seg.key}
            className="flex flex-col items-center gap-0.5"
            style={{ width: `${seg.pct}%`, minWidth: seg.count > 0 ? "2rem" : undefined }}
          >
            <span className={cn("text-[10px] font-semibold tabular-nums", seg.textColor)}>
              {seg.pct.toFixed(0)}%
            </span>
            <span className="text-[9px] text-gray-500 truncate max-w-full text-center">
              {seg.label}
            </span>
          </div>
        ))}
      </div>

      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {segments.map((seg, i) => (
          <div
            key={seg.key}
            className={cn(
              "h-full transition-all duration-700",
              seg.color,
              i === 0 && "rounded-l-full",
              i === segments.length - 1 && "rounded-r-full"
            )}
            style={{ width: `${seg.pct}%` }}
            title={`${seg.label}: ${seg.count} (${seg.pct.toFixed(1)}%)`}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        {segments.map((seg) => (
          <div key={seg.key} className="flex items-center gap-1.5">
            <span className={cn("inline-block h-2 w-2 rounded-full", seg.color)} />
            <span className="text-xs text-gray-400">
              {seg.label}{" "}
              <span className={cn("font-semibold", seg.textColor)}>{seg.count}</span>
            </span>
          </div>
        ))}
        <span className="ml-auto text-xs text-gray-600">Total: {total}</span>
      </div>
    </div>
  );
}
