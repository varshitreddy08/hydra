"use client";

import { useSimulationStore } from "@/lib/store/simulationStore";
import { AuditTable } from "@/components/decisions/AuditTable";
import { Download } from "lucide-react";

export default function DecisionsPage() {
  const { decisions, auditLog } = useSimulationStore();

  function exportJSON() {
    const blob = new Blob([JSON.stringify(decisions, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `decisions-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportCSV() {
    const headers = [
      "id",
      "patientId",
      "outcome",
      "confidenceScore",
      "decisionTimeMs",
      "decidedAt",
      "auditHash",
    ];
    const rows = decisions.map((d) =>
      [
        d.id,
        d.patientId,
        d.outcome,
        d.confidenceScore.toFixed(1),
        d.decisionTimeMs,
        new Date(d.decidedAt).toISOString(),
        d.auditHash,
      ].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `decisions-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const allocated = decisions.filter((d) => d.outcome === "ALLOCATED").length;
  const failed = decisions.filter((d) => d.outcome === "FAILED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Decision Audit Trail</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Immutable log of all allocation decisions with SHA-256 audit hashes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111b2e] border border-[#1e2d4a] text-slate-300 rounded-lg text-xs font-medium hover:border-slate-600 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
          <button
            onClick={exportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111b2e] border border-[#1e2d4a] text-slate-300 rounded-lg text-xs font-medium hover:border-slate-600 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            JSON
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Decisions", value: decisions.length, color: "text-blue-300 bg-blue-500/10 border-blue-500/30" },
          { label: "Allocated", value: allocated, color: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30" },
          { label: "Failed", value: failed, color: "text-red-300 bg-red-500/10 border-red-500/30" },
          { label: "Audit Entries", value: auditLog.length, color: "text-slate-300 bg-slate-800 border-slate-700" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`border rounded-xl p-4 ${color}`}>
            <p className="text-xs font-medium mb-2 opacity-80">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Audit table */}
      <AuditTable />
    </div>
  );
}
