"use client";

import { useState } from "react";
import { useSimulationStore } from "@/lib/store/simulationStore";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Activity, LogOut, MapPin, LayoutDashboard, Users, Database,
  FileText, BarChart3, GitBranch, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PatientDetailPanel } from "./PatientDetailPanel";
import { AdmitWithReferralDialog } from "./AdmitWithReferralDialog";
import { HospitalDashboardTab } from "./tabs/HospitalDashboardTab";
import { HospitalPatientsTab } from "./tabs/HospitalPatientsTab";
import { HospitalResourcesTab } from "./tabs/HospitalResourcesTab";
import { HospitalDecisionsTab } from "./tabs/HospitalDecisionsTab";
import { HospitalAnalyticsTab } from "./tabs/HospitalAnalyticsTab";
import { HospitalNegotiationTab } from "./tabs/HospitalNegotiationTab";
import type { Patient } from "@/types";

type Tab = "dashboard" | "negotiation" | "patients" | "resources" | "decisions" | "analytics";

const NAV: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "dashboard",   label: "Dashboard",   icon: LayoutDashboard },
  { id: "negotiation", label: "Negotiation", icon: GitBranch },
  { id: "patients",    label: "Patients",    icon: Users },
  { id: "resources",   label: "Resources",   icon: Database },
  { id: "decisions",   label: "Decisions",   icon: FileText },
  { id: "analytics",  label: "Analytics",   icon: BarChart3 },
];

interface Props {
  hospitalId: string;
  hospitalName: string;
  hospitalAddress: string;
  staffName: string;
}

export function HospitalPortalShell({ hospitalId, hospitalName, hospitalAddress, staffName }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [admitOpen, setAdmitOpen] = useState(false);
  const router = useRouter();

  const { patients, resources } = useSimulationStore();

  const hospitalResources = resources.filter((r) => r.hospitalId === hospitalId);
  const hospitalResourceIds = new Set(hospitalResources.map((r) => r.id));

  const myPatients = patients.filter(
    (p) =>
      p.status !== "DISCHARGED" &&
      (
        p.admittedByHospitalId === hospitalId ||
        p.allocatedResources.some((rId) => hospitalResourceIds.has(rId))
      )
  );

  const criticalCount = myPatients.filter(
    (p) => p.triageScore.triageLevel === "P1_IMMEDIATE"
  ).length;

  const liveSelected = selectedPatient
    ? (patients.find((p) => p.id === selectedPatient.id) ?? null)
    : null;

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/hospital-login");
    router.refresh();
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#080c18" }}>
      {/* ── Sidebar ── */}
      <aside className="w-16 lg:w-60 flex flex-col bg-[#0d1526] border-r border-[#1e2d4a] h-full shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-[#1e2d4a]">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="hidden lg:block min-w-0">
            <p className="text-sm font-bold text-white leading-tight truncate">{hospitalName}</p>
            <p className="text-xs text-slate-500">Staff Portal</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {NAV.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full",
                  active
                    ? "bg-blue-600/20 text-blue-300 border border-blue-500/30"
                    : "text-slate-400 hover:bg-[#1c2a42] hover:text-slate-200"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden lg:block">{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="p-2 border-t border-[#1e2d4a]">
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all w-full"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="hidden lg:block">Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-[#0d1526] border-b border-[#1e2d4a] flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="hidden sm:flex items-center gap-1.5 text-slate-500 text-xs">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate max-w-[220px]">{hospitalAddress || hospitalName}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {criticalCount > 0 && (
              <button
                onClick={() => setActiveTab("patients")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg animate-pulse cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs text-red-300 font-medium">{criticalCount} CRITICAL</span>
              </button>
            )}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#111b2e] border border-[#1e2d4a] rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span className="text-xs text-slate-400 hidden sm:inline">{staffName}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {activeTab === "dashboard" && (
            <HospitalDashboardTab
              hospitalId={hospitalId}
              hospitalName={hospitalName}
              myPatients={myPatients}
              hospitalResources={hospitalResources}
              onAdmit={() => setAdmitOpen(true)}
              onViewPatient={setSelectedPatient}
              onGoToPatients={() => setActiveTab("patients")}
            />
          )}
          {activeTab === "negotiation" && (
            <HospitalNegotiationTab
              hospitalId={hospitalId}
              myPatients={myPatients}
              hospitalResourceIds={hospitalResourceIds}
            />
          )}
          {activeTab === "patients" && (
            <HospitalPatientsTab
              hospitalId={hospitalId}
              myPatients={myPatients}
              hospitalResources={hospitalResources}
              hospitalResourceIds={hospitalResourceIds}
              onAdmit={() => setAdmitOpen(true)}
              onViewPatient={setSelectedPatient}
            />
          )}
          {activeTab === "resources" && (
            <HospitalResourcesTab
              hospitalId={hospitalId}
              hospitalResources={hospitalResources}
              myPatients={myPatients}
            />
          )}
          {activeTab === "decisions" && (
            <HospitalDecisionsTab
              myPatients={myPatients}
            />
          )}
          {activeTab === "analytics" && (
            <HospitalAnalyticsTab
              hospitalId={hospitalId}
              myPatients={myPatients}
              hospitalResources={hospitalResources}
            />
          )}
        </main>
      </div>

      {/* Patient detail slide-over */}
      {liveSelected && (
        <PatientDetailPanel
          patient={liveSelected}
          onClose={() => setSelectedPatient(null)}
          hospitalId={hospitalId}
        />
      )}

      <AdmitWithReferralDialog
        open={admitOpen}
        onClose={() => setAdmitOpen(false)}
        currentHospitalId={hospitalId}
      />
    </div>
  );
}
