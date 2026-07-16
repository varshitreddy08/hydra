"use client";

import { useState } from "react";
import { useSimulationStore } from "@/lib/store/simulationStore";
import { PatientQueue } from "@/components/patients/PatientQueue";
import { AdmitPatientDialog } from "@/components/patients/AdmitPatientDialog";
import { UserPlus, Users, Clock, CheckCircle } from "lucide-react";

export default function PatientsPage() {
  const [admitOpen, setAdmitOpen] = useState(false);
  const { patients } = useSimulationStore();

  const waiting = patients.filter((p) => p.status === "WAITING").length;
  const inNegotiation = patients.filter(
    (p) => p.status === "IN_NEGOTIATION"
  ).length;
  const allocated = patients.filter((p) => p.status === "ALLOCATED").length;
  const discharged = patients.filter((p) => p.status === "DISCHARGED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Patient Management</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Triage queue with real-time priority scoring
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
          { label: "Waiting", value: waiting, icon: Clock, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
          { label: "In Negotiation", value: inNegotiation, icon: Users, color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
          { label: "Allocated", value: allocated, icon: CheckCircle, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
          { label: "Discharged", value: discharged, icon: CheckCircle, color: "text-slate-400 bg-slate-800 border-slate-700" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className={`border rounded-xl p-4 ${color}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium opacity-80">{label}</span>
              <Icon className="w-4 h-4 opacity-60" />
            </div>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Patient queue */}
      <div>
        <h2 className="text-sm font-semibold text-slate-300 mb-4">
          Triage Queue — sorted by priority score
        </h2>
        <PatientQueue />
      </div>

      <AdmitPatientDialog
        open={admitOpen}
        onClose={() => setAdmitOpen(false)}
      />
    </div>
  );
}
