"use client";

import { useState } from "react";
import { useSimulationStore } from "@/lib/store/simulationStore";
import { AddHospitalDialog } from "@/components/resources/AddHospitalDialog";
import { Building2, Plus, MapPin, Phone, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ResourcesPage() {
  const { hospitals, resources } = useSimulationStore();
  const [addHospitalOpen, setAddHospitalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Resource Management</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Manage hospitals and their autonomous resource agents
          </p>
        </div>
        <button
          onClick={() => setAddHospitalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Hospital
        </button>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Hospitals", value: hospitals.length, cls: "text-blue-400" },
          { label: "Total Resources", value: resources.length, cls: "text-white" },
          { label: "Available", value: resources.filter((r) => r.status === "AVAILABLE").length, cls: "text-emerald-400" },
        ].map(({ label, value, cls }) => (
          <div key={label} className="rounded-xl border border-[#1e2d4a] bg-[#111b2e] p-4">
            <p className={`text-2xl font-bold ${cls}`}>{value}</p>
            <p className="mt-0.5 text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Hospital cards */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-400">Hospitals</h2>
        {hospitals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#1e2d4a] bg-[#111b2e] p-10 text-center">
            <Building2 className="mx-auto mb-3 h-8 w-8 text-slate-600" />
            <p className="text-sm text-slate-500">No hospitals yet. Add one to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {hospitals.map((hospital) => {
              const hospitalResources = resources.filter((r) => r.hospitalId === hospital.id);
              const available = hospitalResources.filter((r) => r.status === "AVAILABLE").length;
              const occupied = hospitalResources.filter((r) => r.status === "OCCUPIED").length;
              const maintenance = hospitalResources.filter((r) => r.status === "MAINTENANCE").length;

              return (
                <Link
                  key={hospital.id}
                  href={`/resources/${hospital.id}`}
                  className="group flex flex-col gap-4 rounded-xl border border-[#1e2d4a] bg-[#111b2e] p-5 transition-all hover:border-blue-500/40 hover:bg-[#111b2e]/80"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <Building2 className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                          {hospital.name}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {hospitalResources.length} resources
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-blue-400 transition-colors mt-1 shrink-0" />
                  </div>

                  {/* Info */}
                  {(hospital.address || hospital.phone) && (
                    <div className="space-y-1.5">
                      {hospital.address && (
                        <div className="flex items-start gap-1.5 text-[11px] text-slate-500">
                          <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                          {hospital.address}
                        </div>
                      )}
                      {hospital.phone && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <Phone className="h-3 w-3 shrink-0" />
                          {hospital.phone}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Resource status bar */}
                  <div className="space-y-2">
                    {hospitalResources.length > 0 && (
                      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-[#1e2d4a]">
                        <div
                          className="bg-emerald-500 transition-all"
                          style={{ width: `${(available / hospitalResources.length) * 100}%` }}
                        />
                        <div
                          className="bg-red-500 transition-all"
                          style={{ width: `${(occupied / hospitalResources.length) * 100}%` }}
                        />
                        <div
                          className="bg-amber-500 transition-all"
                          style={{ width: `${(maintenance / hospitalResources.length) * 100}%` }}
                        />
                      </div>
                    )}
                    <div className="flex gap-3 text-[10px]">
                      <span className="text-emerald-400">{available} available</span>
                      <span className="text-red-400">{occupied} occupied</span>
                      <span className="text-amber-400">{maintenance} maintenance</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <AddHospitalDialog open={addHospitalOpen} onClose={() => setAddHospitalOpen(false)} />
    </div>
  );
}
