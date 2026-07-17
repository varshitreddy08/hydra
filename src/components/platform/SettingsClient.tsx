"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Settings, Save, Loader2, CheckCircle2 } from "lucide-react";

interface Props {
  weights:   Record<string, number>;
  emergency: Record<string, unknown>;
}

export function SettingsClient({ weights: initialWeights, emergency: initialEmergency }: Props) {
  const [weights, setWeights]   = useState({ availability: 0.40, distance: 0.25, doctor_availability: 0.15, ambulance_eta: 0.10, hospital_load: 0.10, ...initialWeights });
  const [emerg,   setEmerg]     = useState({ max_negotiation_rounds: 3, negotiation_timeout_seconds: 30, auto_escalate_critical: true, min_hospitals_to_negotiate: 2, ...initialEmergency });
  const [saving,  setSaving]    = useState(false);
  const [saved,   setSaved]     = useState(false);

  const total = Object.values(weights).reduce((s, v) => s + Number(v), 0);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    await Promise.all([
      supabase.from("system_config").upsert({ key: "ai_scoring_weights",  value: weights,  updated_at: new Date().toISOString() }),
      supabase.from("system_config").upsert({ key: "emergency_config",    value: emerg,    updated_at: new Date().toISOString() }),
    ]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const weightField = (key: keyof typeof weights, label: string) => (
    <div key={key}>
      <div className="flex justify-between mb-1.5">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm font-bold text-[#1976D2]">{Math.round(Number(weights[key]) * 100)}%</span>
      </div>
      <input
        type="range" min="0" max="1" step="0.05"
        value={Number(weights[key])}
        onChange={e => setWeights(p => ({ ...p, [key]: parseFloat(e.target.value) }))}
        className="w-full accent-[#1976D2]"
      />
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Platform Settings</h2>
        <p className="text-sm text-gray-500 mt-0.5">Configure AI scoring weights and emergency rules</p>
      </div>

      {/* AI Scoring Weights */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-4 h-4 text-purple-600" />
          <h3 className="text-sm font-semibold text-gray-900">AI Scoring Weights</h3>
        </div>
        <div className={`text-xs font-medium px-3 py-2 rounded-xl border ${Math.abs(total - 1) < 0.01 ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
          Total weight: {Math.round(total * 100)}% {Math.abs(total - 1) < 0.01 ? "✓ Valid" : "(should equal 100%)"}
        </div>

        {weightField("availability",        "Resource Availability")}
        {weightField("distance",            "Distance")}
        {weightField("doctor_availability", "Doctor Availability")}
        {weightField("ambulance_eta",       "Ambulance ETA")}
        {weightField("hospital_load",       "Hospital Load")}
      </div>

      {/* Emergency Config */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Emergency Configuration</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: "max_negotiation_rounds",        label: "Max Negotiation Rounds" },
            { key: "negotiation_timeout_seconds",   label: "Timeout (seconds)" },
            { key: "min_hospitals_to_negotiate",    label: "Min Hospitals to Negotiate" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
              <input
                type="number" min="1"
                value={Number(emerg[key as keyof typeof emerg]) || 0}
                onChange={e => setEmerg(p => ({ ...p, [key]: parseInt(e.target.value) || 0 }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1976D2] bg-gray-50"
              />
            </div>
          ))}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="auto_escalate"
              checked={Boolean(emerg.auto_escalate_critical)}
              onChange={e => setEmerg(p => ({ ...p, auto_escalate_critical: e.target.checked }))}
              className="w-4 h-4 accent-[#1976D2]"
            />
            <label htmlFor="auto_escalate" className="text-sm font-medium text-gray-700">Auto-escalate Critical</label>
          </div>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 bg-[#1976D2] hover:bg-[#1565C0] disabled:opacity-60 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors shadow-sm"
      >
        {saving  ? <><Loader2    className="w-4 h-4 animate-spin" />Saving…</> :
         saved   ? <><CheckCircle2 className="w-4 h-4" />Saved!</> :
                   <><Save       className="w-4 h-4" />Save Settings</>}
      </button>
    </div>
  );
}
