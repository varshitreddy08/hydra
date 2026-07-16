"use client";

import { useState, useMemo } from "react";
import { useSimulationStore } from "@/lib/store/simulationStore";
import { PatientQueue } from "@/components/patients/PatientQueue";
import { AdmitPatientDialog } from "@/components/patients/AdmitPatientDialog";
import { UserPlus, Users, Clock, CheckCircle, Activity, Calendar } from "lucide-react";

function toDateKey(ts: number) {
  return new Date(ts).toISOString().slice(0, 10); // "2026-07-16"
}

function formatDateTab(key: string) {
  const d = new Date(key + "T00:00:00");
  const today = toDateKey(Date.now());
  const yesterday = toDateKey(Date.now() - 86400000);
  if (key === today) return "Today";
  if (key === yesterday) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatMonthOption(key: string) {
  return new Date(key + "-01").toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default function PatientsPage() {
  const [admitOpen, setAdmitOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const { patients } = useSimulationStore();

  const allDates = useMemo(() => {
    const set = new Set(patients.map((p) => toDateKey(p.arrivedAt)));
    return Array.from(set).sort().reverse();
  }, [patients]);

  const allMonths = useMemo(() => {
    const set = new Set(allDates.map((d) => d.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [allDates]);

  const visibleDates = selectedMonth
    ? allDates.filter((d) => d.startsWith(selectedMonth))
    : allDates;

  const filteredPatients = useMemo(() => {
    let result = patients;
    if (selectedMonth) {
      result = result.filter((p) => toDateKey(p.arrivedAt).startsWith(selectedMonth));
    }
    if (selectedDate) {
      result = result.filter((p) => toDateKey(p.arrivedAt) === selectedDate);
    }
    return result;
  }, [patients, selectedDate, selectedMonth]);

  const waiting = patients.filter((p) => p.status === "WAITING").length;
  const inNegotiation = patients.filter((p) => p.status === "IN_NEGOTIATION").length;
  const active = patients.filter(
    (p) => p.status === "ALLOCATED" || p.status === "IN_TREATMENT"
  ).length;
  const discharged = patients.filter((p) => p.status === "DISCHARGED").length;

  function handleMonthChange(month: string) {
    setSelectedMonth(month || null);
    setSelectedDate(null);
  }

  function handleDateSelect(date: string) {
    setSelectedDate((prev) => (prev === date ? null : date));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Patient Management</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Triage queue · right-click any row for quick actions
          </p>
        </div>
        <button
          onClick={() => setAdmitOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Admit Patient
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Waiting",
            value: waiting,
            icon: Clock,
            color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
          },
          {
            label: "In Negotiation",
            value: inNegotiation,
            icon: Users,
            color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
          },
          {
            label: "Active",
            value: active,
            icon: Activity,
            color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
          },
          {
            label: "Discharged",
            value: discharged,
            icon: CheckCircle,
            color: "text-slate-400 bg-slate-800 border-slate-700",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`border rounded-xl p-4 ${color}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium opacity-80">{label}</span>
              <Icon className="w-4 h-4 opacity-60" />
            </div>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Date / Month filter */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span className="text-xs text-slate-500 font-medium">Filter by</span>
          </div>

          {/* Month dropdown */}
          {allMonths.length > 0 && (
            <select
              value={selectedMonth ?? ""}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="rounded-lg border border-[#1e2d4a] bg-[#111b2e] px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-colors"
            >
              <option value="">All Months</option>
              {allMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthOption(m)}
                </option>
              ))}
            </select>
          )}

          {/* Patient count badge */}
          <span className="ml-auto text-[10px] text-slate-600 font-medium">
            {filteredPatients.length} patient{filteredPatients.length !== 1 ? "s" : ""}
            {selectedDate || selectedMonth ? " shown" : " total"}
          </span>
        </div>

        {/* Date tabs */}
        {visibleDates.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {/* All tab */}
            <button
              onClick={() => setSelectedDate(null)}
              className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedDate === null
                  ? "border-blue-500/60 bg-blue-500/15 text-blue-300"
                  : "border-[#1e2d4a] bg-[#111b2e] text-slate-400 hover:border-blue-500/30 hover:text-slate-300"
              }`}
            >
              All
            </button>

            {visibleDates.map((d) => {
              const count = patients.filter((p) => toDateKey(p.arrivedAt) === d).length;
              const isActive = selectedDate === d;
              return (
                <button
                  key={d}
                  onClick={() => handleDateSelect(d)}
                  className={`shrink-0 flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "border-blue-500/60 bg-blue-500/15 text-blue-300"
                      : "border-[#1e2d4a] bg-[#111b2e] text-slate-400 hover:border-blue-500/30 hover:text-slate-300"
                  }`}
                >
                  {formatDateTab(d)}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      isActive
                        ? "bg-blue-500/30 text-blue-200"
                        : "bg-white/8 text-slate-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Active filter label */}
        {selectedDate && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">
              Showing records for{" "}
              <span className="font-semibold text-blue-300">{formatDateTab(selectedDate)}</span>
            </span>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-[10px] text-slate-600 hover:text-slate-400 underline transition-colors"
            >
              clear
            </button>
          </div>
        )}
      </div>

      {/* Patient queue */}
      <PatientQueue patients={filteredPatients} />

      <AdmitPatientDialog
        open={admitOpen}
        onClose={() => setAdmitOpen(false)}
      />
    </div>
  );
}
