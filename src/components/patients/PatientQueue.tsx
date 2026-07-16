"use client";

import { useEffect, useState } from "react";
import { useSimulationStore } from "@/lib/store/simulationStore";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { ConfidenceBar } from "@/components/shared/ConfidenceBar";
import { cn } from "@/lib/utils/cn";
import { formatCondition, formatWaitTime } from "@/lib/utils/formatters";
import type { Patient } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  WAITING: "text-gray-300",
  IN_NEGOTIATION: "text-blue-300",
  ALLOCATED: "text-emerald-300",
  IN_TREATMENT: "text-emerald-400",
  DISCHARGED: "text-gray-600",
};

const STATUS_BG: Record<string, string> = {
  WAITING: "bg-gray-500/10 border-gray-500/20",
  IN_NEGOTIATION: "bg-blue-500/10 border-blue-500/20",
  ALLOCATED: "bg-emerald-500/10 border-emerald-500/20",
  IN_TREATMENT: "bg-emerald-600/10 border-emerald-600/20",
  DISCHARGED: "bg-transparent border-transparent",
};

function WaitTime({ arrivedAt }: { arrivedAt: number }) {
  const [display, setDisplay] = useState(() => formatWaitTime(arrivedAt));
  useEffect(() => {
    const id = setInterval(() => setDisplay(formatWaitTime(arrivedAt)), 1000);
    return () => clearInterval(id);
  }, [arrivedAt]);
  return <span className="font-mono text-xs tabular-nums text-gray-400">{display}</span>;
}

export function PatientQueue() {
  const patients = useSimulationStore((s) => s.patients);

  const visiblePatients = patients
    .filter((p) => p.status === "WAITING" || p.status === "IN_NEGOTIATION")
    .sort((a, b) => b.triageScore.raw - a.triageScore.raw);

  if (visiblePatients.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-[#1e2d4a] bg-[#111b2e] p-8">
        <p className="text-sm text-gray-500">No patients in queue</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#1e2d4a] bg-[#111b2e]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1e2d4a]">
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Priority
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                MRN
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Condition
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 min-w-[100px]">
                Score
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Wait
              </th>
            </tr>
          </thead>
          <tbody>
            {visiblePatients.map((patient, index) => {
              const isP1 = patient.triageScore.triageLevel === "P1_IMMEDIATE";
              const isNegotiating = patient.status === "IN_NEGOTIATION";

              return (
                <tr
                  key={patient.id}
                  className={cn(
                    "border-b border-[#1e2d4a]/60 transition-colors last:border-0 hover:bg-white/5",
                    isP1 && "border-l-2 border-l-red-500",
                    isNegotiating && "bg-blue-500/5"
                  )}
                >
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      {isP1 && (
                        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                      )}
                      <PriorityBadge level={patient.triageScore.triageLevel} />
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-xs font-semibold text-white">
                      {patient.mrn}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="max-w-[160px] truncate text-xs text-gray-300">
                      {formatCondition(patient.condition)}
                    </p>
                    <p className="text-[10px] text-gray-600">
                      {patient.age}y {patient.sex}
                    </p>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "w-8 text-right font-mono text-xs font-bold tabular-nums",
                          patient.triageScore.raw >= 70
                            ? "text-red-400"
                            : patient.triageScore.raw >= 40
                            ? "text-amber-400"
                            : "text-green-400"
                        )}
                      >
                        {patient.triageScore.raw.toFixed(0)}
                      </span>
                      <div className="w-16">
                        <ConfidenceBar score={patient.triageScore.raw} />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        "rounded border px-1.5 py-0.5 text-[10px] font-medium",
                        STATUS_BG[patient.status],
                        STATUS_COLORS[patient.status]
                      )}
                    >
                      {patient.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <WaitTime arrivedAt={patient.arrivedAt} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
