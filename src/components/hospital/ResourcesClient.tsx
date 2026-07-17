"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, CheckCircle2, Clock, XCircle, Wrench, Wifi, Pencil, Trash2, BedDouble, Wind, Scissors, Truck, Zap, ScanLine, Gauge, Droplets, Scan, HeartPulse, Package, MapPin } from "lucide-react";
import type { Resource, ResourceStatus, ResourceType } from "@/types";

const statusConfig: Record<ResourceStatus, { label: string; color: string; icon: React.ElementType }> = {
  AVAILABLE:   { label: "Available",   color: "bg-green-50 text-green-700 border-green-200",  icon: CheckCircle2 },
  OCCUPIED:    { label: "Occupied",    color: "bg-red-50 text-red-700 border-red-200",        icon: Clock },
  RESERVED:    { label: "Reserved",    color: "bg-amber-50 text-amber-700 border-amber-200",  icon: Clock },
  MAINTENANCE: { label: "Maintenance", color: "bg-purple-50 text-purple-700 border-purple-200",icon: Wrench },
  OFFLINE:     { label: "Offline",     color: "bg-gray-100 text-gray-500 border-gray-200",    icon: XCircle },
};

const typeIconMap: Record<string, React.ElementType> = {
  ICU_BED: BedDouble, VENTILATOR: Wind, OPERATION_THEATER: Scissors,
  AMBULANCE: Truck, EMERGENCY_ROOM: Zap, MRI_MACHINE: ScanLine,
  OXYGEN_CONCENTRATOR: Gauge, BLOOD_BANK: Droplets, CT_SCANNER: Scan, DEFIBRILLATOR: HeartPulse,
};

interface Props {
  resources: Resource[];
  hospitalId: string;
  canEdit: boolean;
}

export function ResourcesClient({ resources, hospitalId, canEdit }: Props) {
  const router = useRouter();
  const [search, setSearch]       = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showAdd, setShowAdd]         = useState(false);
  const [editResource, setEditResource] = useState<Resource | null>(null);
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [updating, setUpdating]       = useState<string | null>(null);

  const types = ["ALL", ...new Set(resources.map(r => r.type))];

  const filtered = resources.filter(r => {
    const matchType   = typeFilter === "ALL" || r.type === typeFilter;
    const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
    const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.type.toLowerCase().includes(search.toLowerCase());
    return matchType && matchStatus && matchSearch;
  });

  async function deleteResource(id: string) {
    setDeletingId(id);
    const supabase = createClient();
    await supabase.from("resources").delete().eq("id", id);
    router.refresh();
    setDeletingId(null);
  }

  async function updateStatus(id: string, status: ResourceStatus) {
    setUpdating(id);
    const supabase = createClient();
    await supabase.from("resources").update({ status, last_updated: new Date().toISOString() }).eq("id", id);
    router.refresh();
    setUpdating(null);
  }

  const available = resources.filter(r => r.status === "AVAILABLE").length;
  const occupied  = resources.filter(r => r.status === "OCCUPIED").length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Resource Inventory</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {available} available · {occupied} occupied · {resources.length} total
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 bg-[#1976D2] hover:bg-[#1565C0] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Resource
          </button>
        )}
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {(["AVAILABLE","OCCUPIED","RESERVED","MAINTENANCE","OFFLINE"] as ResourceStatus[]).map(s => {
          const count = resources.filter(r => r.status === s).length;
          const cfg   = statusConfig[s];
          const Icon  = cfg.icon;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? "ALL" : s)}
              className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                statusFilter === s
                  ? `${cfg.color} border-current`
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              <div>
                <p className="text-lg font-bold leading-tight">{count}</p>
                <p className="text-xs">{cfg.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search resources…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 bg-white w-56"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1976D2] bg-white"
          >
            {types.map(t => (
              <option key={t} value={t}>{t === "ALL" ? "All Types" : t.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Resource grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-400">
          <Wifi className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No resources found</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => {
            const cfg  = statusConfig[r.status];
            const Icon = cfg.icon;
            const TypeIcon = typeIconMap[r.type] || Package;
            const isUpdating = updating === r.id;
            return (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm card-hover">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <TypeIcon className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{r.name}</p>
                        <p className="text-xs text-gray-400">{r.type.replace(/_/g, " ")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${cfg.color}`}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                      {canEdit && (
                        <>
                          <button
                            onClick={() => setEditResource(r)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#1976D2] hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteResource(r.id)}
                            disabled={deletingId === r.id}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {r.specialization && (
                    <p className="text-xs text-purple-600 bg-purple-50 border border-purple-200 rounded-lg px-2 py-1 mb-2 w-fit">
                      {r.specialization.replace(/_/g, " ")}
                    </p>
                  )}
                  {r.location && (
                    <p className="text-xs text-gray-400 mb-3 flex items-center gap-1"><MapPin className="w-3 h-3" />{r.location}</p>
                  )}

                  {canEdit && (
                    <div className="border-t border-gray-100 pt-3 flex flex-wrap gap-1.5">
                      {(["AVAILABLE","OCCUPIED","RESERVED","MAINTENANCE","OFFLINE"] as ResourceStatus[]).map(s => (
                        <button
                          key={s}
                          disabled={r.status === s || isUpdating}
                          onClick={() => updateStatus(r.id, s)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                            r.status === s
                              ? `${statusConfig[s].color} font-semibold`
                              : "border-gray-200 text-gray-500 hover:border-gray-300"
                          }`}
                        >
                          {isUpdating && r.status !== s ? "…" : s.charAt(0) + s.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <AddResourceModal hospitalId={hospitalId} onClose={() => { setShowAdd(false); router.refresh(); }} />
      )}
      {editResource && (
        <EditResourceModal resource={editResource} onClose={() => { setEditResource(null); router.refresh(); }} />
      )}
    </div>
  );
}

function EditResourceModal({ resource, onClose }: { resource: Resource; onClose: () => void }) {
  const [type,    setType]    = useState<ResourceType>(resource.type);
  const [name,    setName]    = useState(resource.name);
  const [spec,    setSpec]    = useState(resource.specialization || "");
  const [loc,     setLoc]     = useState(resource.location || "");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const router = useRouter();

  const TYPES: ResourceType[] = [
    "ICU_BED","VENTILATOR","OPERATION_THEATER","AMBULANCE",
    "EMERGENCY_ROOM","MRI_MACHINE","OXYGEN_CONCENTRATOR","BLOOD_BANK","CT_SCANNER","DEFIBRILLATOR",
  ];

  async function handleSave() {
    if (!name.trim()) { setError("Name is required"); return; }
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.from("resources").update({
      type,
      name:           name.trim(),
      specialization: spec.trim() || null,
      location:       loc.trim() || null,
      last_updated:   new Date().toISOString(),
    }).eq("id", resource.id);
    if (err) { setError(err.message); setLoading(false); return; }
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Edit Resource</h3>
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Resource Type</label>
          <select value={type} onChange={e => setType(e.target.value as ResourceType)} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1976D2] bg-gray-50">
            {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Name / ID</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1976D2] bg-gray-50" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Specialization (optional)</label>
          <input value={spec} onChange={e => setSpec(e.target.value)} placeholder="e.g. CARDIOLOGIST" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1976D2] bg-gray-50" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Location (optional)</label>
          <input value={loc} onChange={e => setLoc(e.target.value)} placeholder="e.g. Wing A, Floor 2" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1976D2] bg-gray-50" />
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 bg-[#1976D2] hover:bg-[#1565C0] disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors">
            {loading ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddResourceModal({ hospitalId, onClose }: { hospitalId: string; onClose: () => void }) {
  const [type,   setType]   = useState<ResourceType>("ICU_BED");
  const [name,   setName]   = useState("");
  const [spec,   setSpec]   = useState("");
  const [loc,    setLoc]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]  = useState<string | null>(null);
  const router = useRouter();

  const TYPES: ResourceType[] = [
    "ICU_BED","VENTILATOR","OPERATION_THEATER","AMBULANCE",
    "EMERGENCY_ROOM","MRI_MACHINE","OXYGEN_CONCENTRATOR","BLOOD_BANK","CT_SCANNER","DEFIBRILLATOR",
  ];

  async function handleAdd() {
    if (!name.trim()) { setError("Name is required"); return; }
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.from("resources").insert({
      hospital_id:   hospitalId,
      type,
      name:          name.trim(),
      specialization: spec.trim() || null,
      location:      loc.trim() || null,
      status:        "AVAILABLE",
    });
    if (err) { setError(err.message); setLoading(false); return; }
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Add New Resource</h3>
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Resource Type</label>
          <select
            value={type}
            onChange={e => setType(e.target.value as ResourceType)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1976D2] bg-gray-50"
          >
            {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Name / ID</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. ICU-A01" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1976D2] bg-gray-50" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Specialization (optional)</label>
          <input value={spec} onChange={e => setSpec(e.target.value)} placeholder="e.g. CARDIOLOGIST" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1976D2] bg-gray-50" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Location (optional)</label>
          <input value={loc} onChange={e => setLoc(e.target.value)} placeholder="e.g. Wing A, Floor 2" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1976D2] bg-gray-50" />
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleAdd} disabled={loading} className="flex-1 py-2.5 bg-[#1976D2] hover:bg-[#1565C0] disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors">
            {loading ? "Adding…" : "Add Resource"}
          </button>
        </div>
      </div>
    </div>
  );
}
