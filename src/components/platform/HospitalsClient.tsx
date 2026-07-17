"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Building2, CheckCircle2, Clock, XCircle, Plus,
  Search, Shield, ShieldOff, MapPin, Phone, Star,
  Loader2, BedDouble, Wind, Stethoscope, Truck,
} from "lucide-react";
import type { Hospital, HospitalStatus } from "@/types";

interface Props { hospitals: Hospital[]; }

const statusConfig: Record<HospitalStatus, { label: string; color: string; icon: React.ElementType }> = {
  active:    { label: "Active",    color: "bg-green-50 text-green-700 border-green-200",  icon: CheckCircle2 },
  pending:   { label: "Pending",   color: "bg-amber-50 text-amber-700 border-amber-200",  icon: Clock },
  suspended: { label: "Suspended", color: "bg-red-50 text-red-700 border-red-200",        icon: XCircle },
};

const tierColors: Record<string, string> = {
  premium:  "bg-purple-50 text-purple-700 border-purple-200",
  standard: "bg-blue-50 text-blue-700 border-blue-200",
  basic:    "bg-gray-100 text-gray-600 border-gray-200",
};

export function HospitalsClient({ hospitals }: Props) {
  const router  = useRouter();
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showAdd,      setShowAdd]      = useState(false);
  const [updating,     setUpdating]     = useState<string | null>(null);

  const filtered = hospitals.filter(h => {
    const matchStatus = statusFilter === "ALL" || h.status === statusFilter;
    const matchSearch = !search || h.name.toLowerCase().includes(search.toLowerCase()) || h.city?.toLowerCase().includes(search.toLowerCase()) || h.code.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  async function updateStatus(id: string, status: HospitalStatus) {
    setUpdating(id);
    const supabase = createClient();
    await supabase.from("hospitals").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    router.refresh();
    setUpdating(null);
  }

  const counts = {
    ALL:       hospitals.length,
    active:    hospitals.filter(h => h.status === "active").length,
    pending:   hospitals.filter(h => h.status === "pending").length,
    suspended: hospitals.filter(h => h.status === "suspended").length,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hospital Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage hospitals on the MedResponse network</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 bg-[#1976D2] hover:bg-[#1565C0] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Register Hospital
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["ALL","active","pending","suspended"] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              statusFilter === s
                ? "bg-[#1976D2] text-white border-[#1976D2]"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            {s === "ALL" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="ml-2 text-xs font-bold opacity-70">
              {counts[s]}
            </span>
          </button>
        ))}
        <div className="ml-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            placeholder="Search hospitals…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#1976D2] bg-white w-56"
          />
        </div>
      </div>

      {/* Hospital cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map(h => {
          const statusCfg = statusConfig[h.status];
          const StatusIcon = statusCfg.icon;
          const isUpdating = updating === h.id;
          return (
            <div key={h.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm card-hover overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{h.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{h.code}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${statusCfg.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusCfg.label}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {h.city && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />{h.city}, {h.state}
                    </span>
                  )}
                  {h.phone && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Phone className="w-3 h-3" />{h.phone}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${tierColors[h.tier]}`}>
                    <Star className="w-2.5 h-2.5 inline mr-1" />
                    {h.tier}
                  </span>
                </div>

                {/* Resource counts */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[
                    { label: "ICU",  value: h.total_icu_beds,     Icon: BedDouble   },
                    { label: "Vent", value: h.total_ventilators,  Icon: Wind        },
                    { label: "Dr",   value: h.total_doctors,      Icon: Stethoscope },
                    { label: "Amb",  value: h.total_ambulances,   Icon: Truck       },
                  ].map(({ label, value, Icon }) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-2 text-center border border-gray-100">
                      <Icon className="w-4 h-4 mx-auto mb-0.5 text-gray-400" />
                      <p className="text-sm font-bold text-gray-900">{value}</p>
                      <p className="text-xs text-gray-400">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  {h.status === "pending" && (
                    <button
                      disabled={isUpdating}
                      onClick={() => updateStatus(h.id, "active")}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-50 border border-green-200 hover:bg-green-100 text-green-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-60"
                    >
                      {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                      Approve
                    </button>
                  )}
                  {h.status === "active" && (
                    <button
                      disabled={isUpdating}
                      onClick={() => updateStatus(h.id, "suspended")}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-60"
                    >
                      {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldOff className="w-3.5 h-3.5" />}
                      Suspend
                    </button>
                  )}
                  {h.status === "suspended" && (
                    <button
                      disabled={isUpdating}
                      onClick={() => updateStatus(h.id, "active")}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-50 border border-green-200 hover:bg-green-100 text-green-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-60"
                    >
                      {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                      Reactivate
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No hospitals found</p>
        </div>
      )}

      {/* Add Hospital Modal */}
      {showAdd && (
        <AddHospitalModal onClose={() => { setShowAdd(false); router.refresh(); }} />
      )}
    </div>
  );
}

function AddHospitalModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: "", code: "", city: "", state: "", address: "", phone: "", email: "",
    tier: "standard", total_icu_beds: 0, total_ventilators: 0, total_doctors: 0, total_ambulances: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const router = useRouter();

  async function handleAdd() {
    if (!form.name.trim() || !form.code.trim()) { setError("Name and code are required"); return; }
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.from("hospitals").insert({
      ...form,
      status: "pending",
    });
    if (err) { setError(err.message); setLoading(false); return; }
    router.refresh();
    onClose();
  }

  const field = (key: keyof typeof form, label: string, type = "text", placeholder = "") => (
    <div key={key}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={String(form[key])}
        onChange={e => setForm(p => ({ ...p, [key]: type === "number" ? parseInt(e.target.value) || 0 : e.target.value }))}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1976D2] bg-gray-50"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 my-auto">
        <h3 className="text-lg font-bold text-gray-900">Register New Hospital</h3>
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

        <div className="grid grid-cols-2 gap-4">
          {field("name",  "Hospital Name", "text", "Apollo General Hospital")}
          {field("code",  "Hospital Code", "text", "HOSP-001")}
          {field("city",  "City")}
          {field("state", "State")}
          {field("phone", "Phone")}
          {field("email", "Email", "email")}
        </div>

        {field("address", "Address")}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tier</label>
          <select value={form.tier} onChange={e => setForm(p => ({ ...p, tier: e.target.value }))} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1976D2] bg-gray-50">
            {["basic","standard","premium"].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {field("total_icu_beds",    "ICU Beds",    "number", "10")}
          {field("total_ventilators", "Ventilators", "number", "8")}
          {field("total_doctors",     "Doctors",     "number", "20")}
          {field("total_ambulances",  "Ambulances",  "number", "4")}
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleAdd} disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1976D2] hover:bg-[#1565C0] disabled:opacity-60 text-white rounded-xl text-sm font-semibold">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Registering…</> : "Register Hospital"}
          </button>
        </div>
      </div>
    </div>
  );
}
