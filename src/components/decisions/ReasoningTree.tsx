"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ReasoningFactor } from "@/types";

interface ReasoningTreeProps {
  factors: ReasoningFactor[];
  summary: string;
}

interface FactorNodeProps {
  factor: ReasoningFactor;
}

function FactorNode({ factor }: FactorNodeProps) {
  const [expanded, setExpanded] = useState(false);

  const directionIcon =
    factor.direction === "POSITIVE" ? (
      <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
    ) : factor.direction === "NEGATIVE" ? (
      <TrendingDown className="h-3.5 w-3.5 text-red-400" />
    ) : (
      <Minus className="h-3.5 w-3.5 text-gray-400" />
    );

  const borderColor =
    factor.direction === "POSITIVE"
      ? "border-emerald-500/20"
      : factor.direction === "NEGATIVE"
      ? "border-red-500/20"
      : "border-[#1e2d4a]";

  const valueBg =
    factor.direction === "POSITIVE"
      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
      : factor.direction === "NEGATIVE"
      ? "bg-red-500/10 text-red-300 border-red-500/20"
      : "bg-gray-500/10 text-gray-300 border-gray-500/20";

  const weightPct = Math.min(100, factor.weight * 100);

  return (
    <div className={cn("rounded-lg border", borderColor)}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
      >
        <span className="shrink-0 text-gray-500">
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </span>

        <span className="flex-1 truncate text-xs font-medium text-gray-200">
          {factor.factor.replace(/_/g, " ")}
        </span>

        <span
          className={cn(
            "shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold",
            valueBg
          )}
        >
          {typeof factor.value === "number" ? factor.value.toFixed(2) : factor.value}
        </span>

        <div className="flex shrink-0 items-center gap-1.5">
          <div className="h-1 w-12 overflow-hidden rounded-full bg-white/10">
            <div
              className={cn(
                "h-full rounded-full",
                factor.direction === "POSITIVE"
                  ? "bg-emerald-400"
                  : factor.direction === "NEGATIVE"
                  ? "bg-red-400"
                  : "bg-gray-400"
              )}
              style={{ width: `${weightPct}%` }}
            />
          </div>
          <span className="w-8 text-right font-mono text-[10px] text-gray-500">
            {(factor.weight * 100).toFixed(0)}%
          </span>
        </div>

        <span className="shrink-0">{directionIcon}</span>
      </button>

      {expanded && (
        <div className="border-t border-[#1e2d4a] px-3 pb-2.5 pt-2">
          <p className="text-xs leading-relaxed text-gray-400">{factor.explanation}</p>
        </div>
      )}
    </div>
  );
}

export function ReasoningTree({ factors, summary }: ReasoningTreeProps) {
  const positiveFactors = factors.filter((f) => f.direction === "POSITIVE");
  const negativeFactors = factors.filter((f) => f.direction === "NEGATIVE");
  const neutralFactors = factors.filter((f) => f.direction === "NEUTRAL");

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <blockquote className="rounded-lg border-l-2 border-blue-500 bg-blue-500/10 px-4 py-3">
        <p className="text-sm leading-relaxed text-blue-200">{summary}</p>
      </blockquote>

      {/* Positive factors */}
      {positiveFactors.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-500">
            <TrendingUp className="h-3 w-3" /> Supporting Factors
          </p>
          {positiveFactors.map((f, i) => (
            <FactorNode key={`pos-${i}`} factor={f} />
          ))}
        </div>
      )}

      {/* Negative factors */}
      {negativeFactors.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-red-500">
            <TrendingDown className="h-3 w-3" /> Opposing Factors
          </p>
          {negativeFactors.map((f, i) => (
            <FactorNode key={`neg-${i}`} factor={f} />
          ))}
        </div>
      )}

      {/* Neutral factors */}
      {neutralFactors.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            <Minus className="h-3 w-3" /> Neutral Factors
          </p>
          {neutralFactors.map((f, i) => (
            <FactorNode key={`neu-${i}`} factor={f} />
          ))}
        </div>
      )}
    </div>
  );
}
