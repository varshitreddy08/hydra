"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AlertTriangle, Plus, X, ArrowLeft, Loader2, BedDouble, Wind, Scissors, Truck, Zap, ScanLine, Gauge, Droplets, Scan, HeartPulse, Sparkles } from "lucide-react";
import Link from "next/link";
import type { ResourceType, Severity, BloodGroup } from "@/types";

const RESOURCE_OPTIONS: { type: ResourceType; label: string; Icon: React.ElementType }[] = [
  { type: "ICU_BED",              label: "ICU Bed",             Icon: BedDouble  },
  { type: "VENTILATOR",           label: "Ventilator",          Icon: Wind       },
  { type: "OPERATION_THEATER",    label: "Operation Theater",   Icon: Scissors   },
  { type: "AMBULANCE",            label: "Ambulance",           Icon: Truck      },
  { type: "EMERGENCY_ROOM",       label: "Emergency Room",      Icon: Zap        },
  { type: "MRI_MACHINE",          label: "MRI Machine",         Icon: ScanLine   },
  { type: "OXYGEN_CONCENTRATOR",  label: "Oxygen Concentrator", Icon: Gauge      },
  { type: "BLOOD_BANK",           label: "Blood Bank",          Icon: Droplets   },
  { type: "CT_SCANNER",           label: "CT Scanner",          Icon: Scan       },
  { type: "DEFIBRILLATOR",        label: "Defibrillator",       Icon: HeartPulse },
];

const BLOOD_GROUPS: BloodGroup[] = ["A+","A-","B+","B-","AB+","AB-","O+","O-","UNKNOWN"];

let tokenCounter = Math.floor(Math.random() * 900) + 100;

export default function NewEmergencyPage() {
  const router = useRouter();
  const [severity,         setSeverity]         = useState<Severity>("HIGH");
  const [bloodGroup,       setBloodGroup]       = useState<BloodGroup>("UNKNOWN");
  const [selectedResources, setSelectedResources] = useState<ResourceType[]>([]);
  const [etaMinutes,       setEtaMinutes]       = useState("");
  const [clinicalNote,     setClinicalNote]     = useState("");
  const [loading,          setLoading]          = useState(false);
  const [error,            setError]            = useState<string | null>(null);
  const [triageLoading,    setTriageLoading]    = useState(false);
  const [triageReasoning,  setTriageReasoning]  = useState<string | null>(null);

  async function runTriageAI() {
    if (!clinicalNote.trim()) { setError("Write a triage note first so the AI can analyse it"); return; }
    setTriageLoading(true);
    setError(null);
    setTriageReasoning(null);
    try {
      const res = await fetch("/api/ai/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicalNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Triage failed");
      setSeverity(data.severity);
      setSelectedResources(data.resources);
      if (data.blood_group && data.blood_group !== "UNKNOWN") setBloodGroup(data.blood_group);
      setTriageReasoning(data.reasoning);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI triage failed");
    } finally {
      setTriageLoading(false);
    }
  }

  function toggleResource(type: ResourceType) {
    setSelectedResources(prev =>
      prev.includes(type) ? prev.filter(r => r !== type) : [...prev, type]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedResources.length === 0) { setError("Select at least one resource type needed"); return; }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles").select("hospital_id").eq("id", user.id).single();
      if (!profile?.hospital_id) throw new Error("No hospital assigned");

      const patientToken = `P-${new Date().getFullYear()}-${String(++tokenCounter).padStart(3, "0")}`;

      const { error: insertError } = await supabase.from("emergency_requests").insert({
        hospital_id:      profile.hospital_id,
        patient_token:    patientToken,
        severity,
        blood_group:      bloodGroup,
        needed_resources: selectedResources,
        eta_minutes:      etaMinutes ? parseInt(etaMinutes) : null,
        clinical_note:    clinicalNote.trim() || null,
        created_by:       user.id,
        status:           "PENDING",
      });

      if (insertError) throw insertError;

      // Log to audit
      await supabase.from("audit_logs").insert({
        user_id:   user.id,
        user_role: "emergency_doctor",
        hospital_id: profile.hospital_id,
        action:    "EMERGENCY_REQUEST_CREATED",
        entity_type: "EMERGENCY",
        entity_id: patientToken,
        metadata:  { severity, needed_resources: selectedResources },
      });

      router.push("/hospital/emergency");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create request");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/hospital/emergency" className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-gray-900">New Emergency Request</h2>
          <p className="text-sm text-gray-500">Minimum required information only — no patient PII</p>
        </div>
      </div>

      {/* Privacy notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          This form collects only the minimum information needed for resource allocation.
          Patient names, medical histories, addresses, and ID numbers are not required and should not be entered.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Severity */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            Severity Level <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(["CRITICAL","HIGH","MODERATE","LOW"] as Severity[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSeverity(s)}
                className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
                  severity === s
                    ? s === "CRITICAL" ? "bg-red-600 border-red-600 text-white"
                    : s === "HIGH"     ? "bg-amber-500 border-amber-500 text-white"
                    : s === "MODERATE" ? "bg-blue-500 border-blue-500 text-white"
                    :                   "bg-green-500 border-green-500 text-white"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Resources needed */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            Resources Needed <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {RESOURCE_OPTIONS.map(({ type, label, Icon }) => {
              const selected = selectedResources.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleResource(type)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-medium transition-all ${
                    selected
                      ? "bg-[#EFF6FF] border-[#1976D2] text-[#1976D2]"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {label}
                  {selected && <X className="w-3 h-3 ml-auto" />}
                </button>
              );
            })}
          </div>
          {selectedResources.length > 0 && (
            <p className="mt-2 text-xs text-[#1976D2] font-medium">
              Selected: {selectedResources.map(r => r.replace(/_/g, " ")).join(", ")}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Blood group */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Blood Group</label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 bg-gray-50 focus:bg-white"
            >
              {BLOOD_GROUPS.map(bg => (
                <option key={bg} value={bg}>{bg === "UNKNOWN" ? "Unknown / Not Available" : bg}</option>
              ))}
            </select>
          </div>

          {/* ETA */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Ambulance ETA (minutes)</label>
            <input
              type="number"
              min="1"
              max="120"
              value={etaMinutes}
              onChange={(e) => setEtaMinutes(e.target.value)}
              placeholder="e.g. 8"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 bg-gray-50 focus:bg-white"
            />
          </div>
        </div>

        {/* Clinical note */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-gray-800">
              Triage Note <span className="text-gray-400 font-normal">(brief, no PII)</span>
            </label>
            <button
              type="button"
              onClick={runTriageAI}
              disabled={triageLoading || !clinicalNote.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold hover:bg-violet-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {triageLoading
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Analysing…</>
                : <><Sparkles className="w-3.5 h-3.5" />AI Triage</>
              }
            </button>
          </div>
          <textarea
            value={clinicalNote}
            onChange={(e) => setClinicalNote(e.target.value)}
            rows={3}
            maxLength={300}
            placeholder="e.g. Suspected MI, BP 80/50, O2 88%. Requires immediate ICU and ventilator."
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 resize-none bg-gray-50 focus:bg-white"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{clinicalNote.length}/300</p>
          {triageReasoning && (
            <div className="mt-2 flex items-start gap-2 bg-violet-50 border border-violet-200 rounded-xl px-3 py-2.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-500 shrink-0 mt-0.5" />
              <p className="text-xs text-violet-700"><span className="font-semibold">AI:</span> {triageReasoning}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Link href="/hospital/emergency" className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors text-center">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || selectedResources.length === 0}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Creating…</>
            ) : (
              <><Plus className="w-4 h-4" />Create Emergency Request</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
