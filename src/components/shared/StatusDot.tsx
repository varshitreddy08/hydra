"use client";

import { cn } from "@/lib/utils/cn";
import { statusDotColor } from "@/lib/utils/formatters";

interface StatusDotProps {
  status: string;
  className?: string;
}

export function StatusDot({ status, className }: StatusDotProps) {
  const shouldPulse = status === "OCCUPIED" || status === "RESERVED";

  return (
    <span
      className={cn(
        "inline-block h-2.5 w-2.5 rounded-full",
        statusDotColor(status),
        shouldPulse && "animate-pulse",
        className
      )}
      aria-label={status}
    />
  );
}
