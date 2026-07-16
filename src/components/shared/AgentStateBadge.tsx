"use client";

import { cn } from "@/lib/utils/cn";
import { agentStateColor } from "@/lib/utils/formatters";

interface AgentStateBadgeProps {
  state: string;
  className?: string;
}

export function AgentStateBadge({ state, className }: AgentStateBadgeProps) {
  const colorClasses = agentStateColor(state);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium tracking-wide",
        colorClasses,
        className
      )}
    >
      {state.replace(/_/g, " ")}
    </span>
  );
}
