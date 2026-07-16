"use client";

import { cn } from "@/lib/utils/cn";

interface ConfidenceBarProps {
  score: number; // 0-100
  label?: string;
  className?: string;
}

function barColor(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-500";
}

function textColor(score: number): string {
  if (score >= 70) return "text-emerald-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
}

export function ConfidenceBar({ score, label, className }: ConfidenceBarProps) {
  const clamped = Math.max(0, Math.min(100, score));

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label !== undefined && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{label}</span>
          <span className={cn("text-xs font-medium tabular-nums", textColor(clamped))}>
            {clamped.toFixed(0)}%
          </span>
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barColor(clamped))}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
