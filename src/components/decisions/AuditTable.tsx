"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { useSimulationStore } from "@/lib/store/simulationStore";
import { ReasoningTree } from "@/components/decisions/ReasoningTree";
import { ConfidenceBar } from "@/components/shared/ConfidenceBar";
import { cn } from "@/lib/utils/cn";
import { formatTime, formatMs } from "@/lib/utils/formatters";
import type { AllocationDecision } from "@/types";

const PAGE_SIZE = 10;

export function AuditTable() {
  const decisions = useSimulationStore((s) => s.decisions);
  const resources = useSimulationStore((s) => s.resources);
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(decisions.length / PAGE_SIZE));
  const pageDecisions = decisions.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function resourceNames(ids: string[]): string {
    if (ids.length === 0) return "—";
    return ids
      .map((id) => {
        const r = resources.find((res) => res.id === id);
        return r?.name ?? id.slice(0, 8);
      })
      .join(", ");
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-xl border border-[#1e2d4a]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e2d4a] bg-[#0d1526]">
                {[
                  "Time",
                  "Patient ID",
                  "Outcome",
                  "Resources",
                  "Decision Time",
                  "Confidence",
                  "Audit Hash",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageDecisions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-sm text-gray-600">
                    No decisions recorded yet
                  </td>
                </tr>
              ) : (
                pageDecisions.map((decision) => {
                  const isExpanded = expandedId === decision.id;
                  return (
                    <>
                      <tr
                        key={decision.id}
                        className={cn(
                          "cursor-pointer border-b border-[#1e2d4a]/60 transition-colors hover:bg-white/5",
                          isExpanded && "bg-white/5"
                        )}
                        onClick={() => toggleExpand(decision.id)}
                      >
                        <td className="px-3 py-2.5">
                          <span className="font-mono text-xs text-gray-400">
                            {formatTime(decision.decidedAt)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="font-mono text-xs text-gray-300">
                            {decision.patientId.slice(0, 12)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={cn(
                              "rounded border px-2 py-0.5 text-xs font-medium",
                              decision.outcome === "ALLOCATED"
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                : decision.outcome === "FAILED"
                                ? "border-red-500/30 bg-red-500/10 text-red-300"
                                : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                            )}
                          >
                            {decision.outcome}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="max-w-[180px] truncate text-xs text-gray-400">
                            {resourceNames(decision.allocatedResourceIds)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="font-mono text-xs text-blue-300">
                            {formatMs(decision.decisionTimeMs)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 min-w-[100px]">
                          <ConfidenceBar score={decision.confidenceScore * 100} />
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="font-mono text-[10px] text-gray-600">
                            {decision.auditHash.slice(0, 16)}...
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="text-gray-500">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </span>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${decision.id}-expanded`} className="bg-[#080c18]">
                          <td colSpan={8} className="px-4 py-4">
                            <div className="max-w-2xl">
                              <ReasoningTree
                                factors={decision.reasoningFactors}
                                summary={decision.naturalLanguageSummary}
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {decisions.length} decisions total
          {decisions.length > 0 &&
            ` · page ${page + 1} of ${totalPages}`}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const pageNum = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={cn(
                  "h-7 w-7 rounded-lg text-xs font-medium transition-colors",
                  pageNum === page
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:bg-white/10 hover:text-white"
                )}
              >
                {pageNum + 1}
              </button>
            );
          })}
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
