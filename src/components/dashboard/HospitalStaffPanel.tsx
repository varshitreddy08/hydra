"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2, UserPlus, RefreshCw, CheckCircle,
  AlertTriangle, User, Edit2, X, Check,
} from "lucide-react";
import { useSimulationStore } from "@/lib/store/simulationStore";
import { CreateHospitalMemberDialog } from "./CreateHospitalMemberDialog";

interface Member {
  id: string;
  fullName: string | null;
  email: string | null;
  hospitalId: string | null;
  createdAt: string;
}

function AssignHospitalInline({
  member,
  onSaved,
}: {
  member: Member;
  onSaved: () => void;
}) {
  const { hospitals } = useSimulationStore();
  const [selected, setSelected] = useState(member.hospitalId ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    setSaving(true);
    setErr("");
    try {
      const hospital = hospitals.find((h) => h.id === selected) ?? null;
      const res = await fetch("/api/admin/hospital-members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: member.id,
          hospitalId: selected || null,
          // Send full hospital data so server can upsert it before setting FK
          hospitalData: hospital
            ? {
                id: hospital.id,
                name: hospital.name,
                address: hospital.address,
                phone: hospital.phone,
                lat: hospital.lat ?? null,
                lng: hospital.lng ?? null,
                createdAt: hospital.createdAt,
              }
            : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "Failed"); return; }
      onSaved();
    } catch {
      setErr("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="flex-1 rounded-lg border border-[#1e2d4a] bg-[#080c18] px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500/60"
      >
        <option value="">— unassigned —</option>
        {hospitals.map((h) => (
          <option key={h.id} value={h.id}>{h.name}</option>
        ))}
      </select>
      <button
        onClick={save}
        disabled={saving || selected === (member.hospitalId ?? "")}
        className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-medium hover:bg-emerald-600/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
        Save
      </button>
      {err && <span className="text-[10px] text-red-400">{err}</span>}
    </div>
  );
}

export function HospitalStaffPanel() {
  const { hospitals } = useSimulationStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/hospital-members");
      if (res.status === 403) return;
      const data = await res.json();
      if (data.members) setMembers(data.members);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  function hospitalName(id: string | null) {
    if (!id) return null;
    return hospitals.find((h) => h.id === id)?.name ?? id;
  }

  return (
    <div className="border-t border-[#1e2d4a] pt-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-slate-300">Hospital Staff Management</h2>
          {members.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium">
              {members.length} staff
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchMembers}
            disabled={loading}
            className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-medium hover:bg-emerald-600/30 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Hospital Staff
          </button>
        </div>
      </div>

      {/* Empty state */}
      {!loading && members.length === 0 && (
        <div className="flex flex-col items-center py-8 text-center bg-[#0d1526] border border-dashed border-[#1e2d4a] rounded-xl">
          <User className="w-8 h-8 text-slate-700 mb-3" />
          <p className="text-sm text-slate-500 font-medium">No hospital staff accounts yet</p>
          <p className="text-xs text-slate-600 mt-1">
            Click <span className="text-emerald-400">"Add Hospital Staff"</span> to create one.
          </p>
        </div>
      )}

      {loading && members.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-4 h-4 text-slate-600 animate-spin" />
        </div>
      )}

      {/* Members list */}
      {members.length > 0 && (
        <div className="space-y-2">
          {members.map((m) => {
            const hName = hospitalName(m.hospitalId);
            const isEditing = editingId === m.id;
            return (
              <div
                key={m.id}
                className="bg-[#0d1526] border border-[#1e2d4a] rounded-xl px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {m.fullName || m.email || "Unnamed"}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{m.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {hName ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-medium">
                        <CheckCircle className="w-3 h-3" />
                        {hName}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-medium">
                        <AlertTriangle className="w-3 h-3" />
                        Unassigned
                      </span>
                    )}
                    <button
                      onClick={() => setEditingId(isEditing ? null : m.id)}
                      className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                      title={isEditing ? "Cancel" : "Assign hospital"}
                    >
                      {isEditing ? <X className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {isEditing && (
                  <AssignHospitalInline
                    member={m}
                    onSaved={() => {
                      setEditingId(null);
                      fetchMembers();
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-slate-600">
        Staff log in at{" "}
        <a href="/hospital-login" className="text-blue-500 hover:underline" target="_blank">
          /hospital-login
        </a>{" "}
        and are routed to the hospital portal automatically.
      </p>

      <CreateHospitalMemberDialog
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          fetchMembers();
        }}
      />
    </div>
  );
}
