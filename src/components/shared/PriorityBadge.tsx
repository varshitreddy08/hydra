"use client";

import { cn } from "@/lib/utils/cn";
import { triageLevelBg } from "@/lib/utils/formatters";

interface PriorityBadgeProps {
  level: string;
  className?: string;
}

const SHORT_LABELS: Record<string, string> = {
  P1_IMMEDIATE: "P1",
  P2_EMERGENT: "P2",
  P3_URGENT: "P3",
  P4_LESS_URGENT: "P4",
  P5_NON_URGENT: "P5",
};

export function PriorityBadge({ level, className }: PriorityBadgeProps) {
  const label = SHORT_LABELS[level] ?? level.slice(0, 2);
  const colorClasses = triageLevelBg(level);

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded border px-1.5 py-0.5 text-xs font-bold tracking-wider",
        colorClasses,
        className
      )}
      title={level}
    >
      {label}
    </span>
  );
}
