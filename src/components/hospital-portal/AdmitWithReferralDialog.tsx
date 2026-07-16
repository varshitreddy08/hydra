"use client";

import { useState, useId } from "react";
import { X, UserPlus, GitBranch, Check } from "lucide-react";
import { useSimulationStore } from "@/lib/store/simulationStore";
import { cn } from "@/lib/utils/cn";
import type { ClinicalCondition, ResourceType } from "@/types";

const CONDITIONS: ClinicalCondition[] = [
  "CARDIAC_ARREST", "TRAUMA_MAJOR", "STROKE_ISCHEMIC", "STROKE_HEMORRHAGIC",
  "SEPSIS", "RESPIRATORY_FAILURE", "BURNS_MAJOR", "POLYTRAUMA", "ANAPHYLAXIS", "OVERDOSE",
];

const CONDITION_RESOURCES: Record<ClinicalCondition, { types: ResourceType[]; caps: string[] }> = {
  CARDIAC_ARREST:      { types: ["EMERGENCY_BAY", "DEFIBRILLATOR", "CARDIOLOGIST"],       caps: ["cardiac", "resuscitation"] },
  TRAUMA_MAJOR:        { types: ["OPERATING_ROOM", "TRAUMA_SURGEON", "ANESTHESIOLOGIST"],  caps: ["trauma"] },
  STROKE_ISCHEMIC:     { types: ["CT_SCANNER", "ICU_BED"],                                 caps: ["neuro", "monitoring"] },
  STROKE_HEMORRHAGIC:  { types: ["OPERATING_ROOM", "ICU_BED"],                             caps: ["neuro", "monitoring"] },
  SEPSIS:              { types: ["ICU_BED", "NURSE_ICU"],                                   caps: ["sepsis", "monitoring"] },
  RESPIRATORY_FAILURE: { types: ["ICU_BED", "VENTILATOR"],                                 caps: ["ventilation", "respiratory"] },
  BURNS_MAJOR:         { types: ["OPERATING_ROOM", "ICU_BED"],                             caps: ["trauma", "monitoring"] },
  POLYTRAUMA:          { types: ["OPERATING_ROOM", "TRAUMA_SURGEON", "ICU_BED"],           caps: ["trauma", "monitoring"] },
  ANAPHYLAXIS:         { types: ["EMERGENCY_BAY", "NURSE_ED"],                             caps: ["resuscitation"] },
  OVERDOSE:            { types: ["EMERGENCY_BAY", "NURSE_ED"],                             caps: ["general"] },
};

const MAX_DETAILS = 500;

function sanitize(raw: string) {
  return raw.replace(/[<>]/g, "").replace(/javascript:/gi, "").replace(/on\w+=/gi, "").slice(0, MAX_DETAILS).trim();
}

function generateMrn() {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return `MRN-${String(new DataView(bytes.buffer).getUint32(0) % 100000).padStart(5, "0")}`;
}

function inputCls(hasError: boolean) {
  return cn(
    "w-full rounded-lg border bg-[#080c18] px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30",
    hasError ? "border-red-500/60" : "border-[#1e2d4a]"
  );
}

function Field({ label, error, children, className }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label className="text-xs font-medium text-gray-400">{label}</label>
      {children}
      {error && <p className="text-[10px] text-red-400">{error}</p>}
    </div>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  currentHospitalId: string;
}

export function AdmitWithReferralDialog({ open, onClose, currentHospitalId }: Props) {
  const { admitPatient, hospitals } = useSimulationStore();
  const formId = useId();

  const [age, setAge] = useState("");
  const [sex, setSex] = useState<"M" | "F" | "OTHER">("M");
  const [condition, setCondition] = useState<ClinicalCondition>("CARDIAC_ARREST");
  const [conditionDetails, setConditionDetails] = useState("");
  const [hr, setHr] = useState("90");
  const [sbp, setSbp] = useState("120");
  const [dbp, setDbp] = useState("80");
  const [rr, setRr] = useState("16");
  const [spo2, setSpo2] = useState("98");
  const [temp, setTemp] = useState("37.0");
  const [gcs, setGcs] = useState("15");
  const [referredIds, setReferredIds] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const otherHospitals = hospitals.filter((h) => h.id !== currentHospitalId);

  function toggleReferral(id: string) {
    setReferredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function validate() {
    const errs: Record<string, string> = {};
    const ageN = Number(age);
    if (!age || isNaN(ageN) || ageN < 0 || ageN > 130) errs.age = "Age must be 0–130";
    if (!conditionDetails.trim()) errs.conditionDetails = "Required";
    if (isNaN(Number(hr)) || Number(hr) < 20 || Number(hr) > 300) errs.hr = "20–300 bpm";
    if (isNaN(Number(sbp)) || Number(sbp) < 40 || Number(sbp) > 300) errs.sbp = "40–300 mmHg";
    if (isNaN(Number(dbp)) || Number(dbp) < 20 || Number(dbp) > 200) errs.dbp = "20–200 mmHg";
    if (isNaN(Number(rr)) || Number(rr) < 4 || Number(rr) > 60) errs.rr = "4–60 /min";
    if (isNaN(Number(spo2)) || Number(spo2) < 50 || Number(spo2) > 100) errs.spo2 = "50–100%";
    if (isNaN(Number(temp)) || Number(temp) < 30 || Number(temp) > 45) errs.temp = "30–45°C";
    if (isNaN(Number(gcs)) || Number(gcs) < 3 || Number(gcs) > 15) errs.gcs = "3–15";
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    const now = Date.now();
    const { types: requiresResourceTypes, caps: requiredCapabilities } = CONDITION_RESOURCES[condition];
    admitPatient({
      id: `pat_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`,
      mrn: generateMrn(),
      age: Number(age),
      sex,
      condition,
      conditionDetails: sanitize(conditionDetails),
      vitals: {
        heartRate: Number(hr), systolicBP: Number(sbp), diastolicBP: Number(dbp),
        respiratoryRate: Number(rr), oxygenSaturation: Number(spo2),
        temperature: Number(temp), consciousnessScore: Number(gcs), timestamp: now,
      },
      arrivedAt: now,
      requiresResourceTypes,
      requiredCapabilities,
      estimatedTreatmentDuration: (60 + Math.floor(Math.random() * 240)) * 60000,
      referredHospitalIds: Array.from(referredIds),
      admittedByHospitalId: currentHospitalId,
    });
    // reset
    setAge(""); setSex("M"); setCondition("CARDIAC_ARREST"); setConditionDetails("");
    setHr("90"); setSbp("120"); setDbp("80"); setRr("16"); setSpo2("98"); setTemp("37.0"); setGcs("15");
    setReferredIds(new Set()); setErrors({}); setSubmitting(false);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#0d1526] border border-[#1e2d4a] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2d4a] shrink-0">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-semibold text-white">Admit Patient</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form id={formId} onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 space-y-5">
            {/* Demographics */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Demographics</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Age" error={errors.age}>
                  <input type="number" min={0} max={130} value={age} onChange={(e) => setAge(e.target.value)} placeholder="0–130" className={inputCls(!!errors.age)} />
                </Field>
                <Field label="Sex">
                  <select value={sex} onChange={(e) => setSex(e.target.value as typeof sex)} className={inputCls(false)}>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </Field>
              </div>
            </div>

            {/* Condition */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Clinical Condition</p>
              <div className="space-y-3">
                <Field label="Condition">
                  <select value={condition} onChange={(e) => setCondition(e.target.value as ClinicalCondition)} className={inputCls(false)}>
                    {CONDITIONS.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
                  </select>
                </Field>
                <Field label="Condition Details" error={errors.conditionDetails}>
                  <textarea value={conditionDetails} onChange={(e) => setConditionDetails(e.target.value)} rows={2} maxLength={MAX_DETAILS} placeholder="Describe presenting symptoms..." className={cn(inputCls(!!errors.conditionDetails), "resize-none")} />
                </Field>
              </div>
            </div>

            {/* Vitals */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Vitals</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Heart Rate (bpm)" error={errors.hr}>
                  <input type="number" value={hr} onChange={(e) => setHr(e.target.value)} className={inputCls(!!errors.hr)} />
                </Field>
                <Field label="Systolic BP (mmHg)" error={errors.sbp}>
                  <input type="number" value={sbp} onChange={(e) => setSbp(e.target.value)} className={inputCls(!!errors.sbp)} />
                </Field>
                <Field label="Diastolic BP (mmHg)" error={errors.dbp}>
                  <input type="number" value={dbp} onChange={(e) => setDbp(e.target.value)} className={inputCls(!!errors.dbp)} />
                </Field>
                <Field label="Resp. Rate (/min)" error={errors.rr}>
                  <input type="number" value={rr} onChange={(e) => setRr(e.target.value)} className={inputCls(!!errors.rr)} />
                </Field>
                <Field label="SpO₂ (%)" error={errors.spo2}>
                  <input type="number" value={spo2} onChange={(e) => setSpo2(e.target.value)} className={inputCls(!!errors.spo2)} />
                </Field>
                <Field label="Temperature (°C)" error={errors.temp}>
                  <input type="number" step="0.1" value={temp} onChange={(e) => setTemp(e.target.value)} className={inputCls(!!errors.temp)} />
                </Field>
                <Field label="GCS (3–15)" error={errors.gcs} className="col-span-2">
                  <input type="number" min={3} max={15} value={gcs} onChange={(e) => setGcs(e.target.value)} className={inputCls(!!errors.gcs)} />
                </Field>
              </div>
            </div>

            {/* Referral */}
            {otherHospitals.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <GitBranch className="w-3.5 h-3.5 text-purple-400" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Recommend Referral Hospitals{" "}
                    <span className="normal-case text-slate-600 font-normal">(optional)</span>
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {otherHospitals.map((h) => {
                    const checked = referredIds.has(h.id);
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => toggleReferral(h.id)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                          checked
                            ? "bg-purple-500/10 border-purple-500/40"
                            : "bg-[#080c18] border-[#1e2d4a] hover:border-purple-500/30"
                        }`}
                      >
                        <div>
                          <p className={`text-sm font-medium ${checked ? "text-purple-200" : "text-slate-300"}`}>{h.name}</p>
                          {h.address && <p className="text-[10px] text-slate-600 mt-0.5">{h.address}</p>}
                        </div>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${checked ? "bg-purple-500 border-purple-500" : "border-slate-600"}`}>
                          {checked && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-[#1e2d4a] bg-[#0d1526] shrink-0">
            <span className="text-xs text-slate-500">
              {referredIds.size > 0 && `${referredIds.size} referral${referredIds.size !== 1 ? "s" : ""} selected`}
            </span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                form={formId}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                Admit Patient
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
