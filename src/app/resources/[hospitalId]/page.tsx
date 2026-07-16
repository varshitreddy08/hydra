"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSimulationStore } from "@/lib/store/simulationStore";
import { ResourceAgentCard } from "@/components/resources/ResourceAgentCard";
import { AddResourceDialog } from "@/components/resources/AddResourceDialog";
import { Building2, ChevronLeft, Plus, Search } from "lucide-react";

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  OPERATING_ROOM: "Operating Rooms",
  ICU_BED: "ICU Beds",
  EMERGENCY_BAY: "Emergency Bays",
  VENTILATOR: "Ventilators",
  CT_SCANNER: "CT Scanners",
  SURGEON: "Surgeons",
  ANESTHESIOLOGIST: "Anesthesiologists",
  NURSE_ICU: "ICU Nurses",
  NURSE_ED: "ED Nurses",
  CARDIOLOGIST: "Cardiologists",
  TRAUMA_SURGEON: "Trauma Surgeons",
  DEFIBRILLATOR: "Defibrillators",
  BLOOD_BANK: "Blood Bank",
};

export default function HospitalDetailPage() {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const { hospitals, resources, agents } = useSimulationStore();
  const [addResourceOpen, setAddResourceOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const hospital = hospitals.find((h) => h.id === hospitalId);
  const hospitalResources = resources.filter((r) => r.hospitalId === hospitalId);

  const filtered = hospitalResources.filter((r) => {
    const matchesSearch =
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.location.toLowerCase().includes(search.toLowerCase()) ||
      r.capabilities.some((c) => c.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = filterStatus === "ALL" || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Group filtered resources by type
  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  const available = hospitalResources.filter((r) => r.status === "AVAILABLE").length;
  const occupied = hospitalResources.filter((r) => r.status === "OCCUPIED").length;
  const maintenance = hospitalResources.filter((r) => r.status === "MAINTENANCE").length;

  if (!hospital) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Building2 className="mb-3 h-10 w-10 text-slate-600" />
        <p className="text-sm text-slate-400">Hospital not found.</p>
        <Link href="/resources" className="mt-4 text-sm text-blue-400 hover:text-blue-300">
          Back to Resources
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/resources"
            className="mb-2 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ChevronLeft className="h-3 w-3" />
            All Hospitals
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Building2 className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{hospital.name}</h1>
              {hospital.address && (
                <p className="text-xs text-slate-500 mt-0.5">{hospital.address}</p>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setAddResourceOpen(true)}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Resource
        </button>
      </div>

      {/* Status summary chips */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        {[
          { label: "Available", count: available, cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
          { label: "Occupied", count: occupied, cls: "text-red-400 bg-red-500/10 border-red-500/30" },
          { label: "Maintenance", count: maintenance, cls: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
          { label: "Total", count: hospitalResources.length, cls: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
        ].map(({ label, count, cls }) => (
          <span key={label} className={`px-2.5 py-1 rounded-lg border font-medium ${cls}`}>
            {count} {label}
          </span>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources, capabilities..."
            className="w-full rounded-lg border border-[#1e2d4a] bg-[#111b2e] pl-8 pr-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500/60"
          />
        </div>
        <div className="flex gap-1.5">
          {["ALL", "AVAILABLE", "OCCUPIED", "MAINTENANCE", "OFFLINE"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                filterStatus === s
                  ? "border-blue-500/50 bg-blue-500/10 text-blue-300"
                  : "border-[#1e2d4a] text-slate-500 hover:text-slate-300"
              }`}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Resource groups */}
      {Object.keys(grouped).length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#1e2d4a] bg-[#111b2e] p-10 text-center">
          <p className="text-sm text-slate-500">
            {hospitalResources.length === 0
              ? "No resources added yet. Click \"Add Resource\" to get started."
              : "No resources match your search or filter."}
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([type, typeResources]) => (
          <div key={type}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-400">
              {RESOURCE_TYPE_LABELS[type] ?? type}
              <span className="text-xs text-slate-600">({typeResources.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {typeResources.map((resource) => {
                const agent = agents.find((a) => a.resourceId === resource.id);
                if (!agent) return null;
                return <ResourceAgentCard key={resource.id} resource={resource} agent={agent} />;
              })}
            </div>
          </div>
        ))
      )}

      <AddResourceDialog
        open={addResourceOpen}
        onClose={() => setAddResourceOpen(false)}
        hospitalId={hospitalId}
      />
    </div>
  );
}
