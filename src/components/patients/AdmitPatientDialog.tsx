"use client";

import { useState, useId } from "react";
import { X, UserPlus } from "lucide-react";
import { useSimulationStore } from "@/lib/store/simulationStore";
import { cn } from "@/lib/utils/cn";
import type { ClinicalCondition } from "@/types";

interface AdmitPatientDialogProps {
  open: boolean;
  onClose: () => void;
}

const CONDITIONS: ClinicalCondition[] = [
  "CARDIAC_ARREST",
  "TRAUMA_MAJOR",
  "STROKE_ISCHEMIC",
  "STROKE_HEMORRHAGIC",
  "SEPSIS",
  "RESPIRATORY_FAILURE",
  "BURNS_MAJOR",
  "POLYTRAUMA",
  "ANAPHYLAXIS",
  "OVERDOSE",
];

interface FormValues {
  age: string;
  sex: "M" | "F" | "OTHER";
  condition: ClinicalCondition;
  conditionDetails: string;
  heartRate: string;
  systolicBP: string;
  diastolicBP: string;
  respiratoryRate: string;
  oxygenSaturation: string;
  temperature: string;
  consciousnessScore: string;
}

interface FormErrors {
  [key: string]: string;
}

const DEFAULTS: FormValues = {
  age: "",
  sex: "M",
  condition: "CARDIAC_ARREST",
  conditionDetails: "",
  heartRate: "90",
  systolicBP: "120",
  diastolicBP: "80",
  respiratoryRate: "16",
  oxygenSaturation: "98",
  temperature: "37.0",
  consciousnessScore: "15",
};

function generateMrn(): string {
  return `MRN${Date.now().toString().slice(-7)}`;
}

function generateId(): string {
  return `pat_${Math.random().toString(36).slice(2, 11)}`;
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  const age = Number(values.age);
  if (!values.age || isNaN(age) || age < 0 || age > 130) {
    errors.age = "Age must be 0–130";
  }
  if (!values.conditionDetails.trim()) {
    errors.conditionDetails = "Required";
  }
  const hr = Number(values.heartRate);
  if (isNaN(hr) || hr < 20 || hr > 300) errors.heartRate = "20–300 bpm";
  const sbp = Number(values.systolicBP);
  if (isNaN(sbp) || sbp < 40 || sbp > 300) errors.systolicBP = "40–300 mmHg";
  const dbp = Number(values.diastolicBP);
  if (isNaN(dbp) || dbp < 20 || dbp > 200) errors.diastolicBP = "20–200 mmHg";
  const rr = Number(values.respiratoryRate);
  if (isNaN(rr) || rr < 4 || rr > 60) errors.respiratoryRate = "4–60 /min";
  const spo2 = Number(values.oxygenSaturation);
  if (isNaN(spo2) || spo2 < 50 || spo2 > 100) errors.oxygenSaturation = "50–100%";
  const temp = Number(values.temperature);
  if (isNaN(temp) || temp < 30 || temp > 45) errors.temperature = "30–45°C";
  const gcs = Number(values.consciousnessScore);
  if (isNaN(gcs) || gcs < 3 || gcs > 15) errors.consciousnessScore = "3–15";
  return errors;
}

export function AdmitPatientDialog({ open, onClose }: AdmitPatientDialogProps) {
  const admitPatient = useSimulationStore((s) => s.admitPatient);
  const [values, setValues] = useState<FormValues>(DEFAULTS);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const formId = useId();

  if (!open) return null;

  function handleChange(field: keyof FormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(values);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    const now = Date.now();
    admitPatient({
      id: generateId(),
      mrn: generateMrn(),
      age: Number(values.age),
      sex: values.sex,
      condition: values.condition,
      conditionDetails: values.conditionDetails.trim(),
      vitals: {
        heartRate: Number(values.heartRate),
        systolicBP: Number(values.systolicBP),
        diastolicBP: Number(values.diastolicBP),
        respiratoryRate: Number(values.respiratoryRate),
        oxygenSaturation: Number(values.oxygenSaturation),
        temperature: Number(values.temperature),
        consciousnessScore: Number(values.consciousnessScore),
        timestamp: now,
      },
      arrivedAt: now,
      requiresResourceTypes: [],
      requiredCapabilities: [],
      estimatedTreatmentDuration: 3600000,
    });
    setValues(DEFAULTS);
    setErrors({});
    setSubmitting(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-[#1e2d4a] bg-[#0d1526] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#1e2d4a] px-5 py-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-400" />
            <h2 className="text-base font-semibold text-white">Admit New Patient</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form id={formId} onSubmit={handleSubmit}>
          <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
            <div className="flex flex-col gap-4">
              {/* Demographics */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Age" error={errors.age}>
                  <input
                    type="number"
                    min={0}
                    max={130}
                    value={values.age}
                    onChange={(e) => handleChange("age", e.target.value)}
                    placeholder="0–130"
                    className={inputCls(!!errors.age)}
                  />
                </Field>
                <Field label="Sex" error={errors.sex}>
                  <select
                    value={values.sex}
                    onChange={(e) => handleChange("sex", e.target.value as "M" | "F" | "OTHER")}
                    className={inputCls(false)}
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </Field>
              </div>

              <Field label="Condition" error={errors.condition}>
                <select
                  value={values.condition}
                  onChange={(e) => handleChange("condition", e.target.value as ClinicalCondition)}
                  className={inputCls(false)}
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Condition Details" error={errors.conditionDetails}>
                <textarea
                  value={values.conditionDetails}
                  onChange={(e) => handleChange("conditionDetails", e.target.value)}
                  rows={2}
                  placeholder="Describe presenting symptoms..."
                  className={cn(inputCls(!!errors.conditionDetails), "resize-none")}
                />
              </Field>

              {/* Vitals */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Vitals
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Heart Rate (bpm)" error={errors.heartRate}>
                    <input
                      type="number"
                      value={values.heartRate}
                      onChange={(e) => handleChange("heartRate", e.target.value)}
                      className={inputCls(!!errors.heartRate)}
                    />
                  </Field>
                  <Field label="Systolic BP (mmHg)" error={errors.systolicBP}>
                    <input
                      type="number"
                      value={values.systolicBP}
                      onChange={(e) => handleChange("systolicBP", e.target.value)}
                      className={inputCls(!!errors.systolicBP)}
                    />
                  </Field>
                  <Field label="Diastolic BP (mmHg)" error={errors.diastolicBP}>
                    <input
                      type="number"
                      value={values.diastolicBP}
                      onChange={(e) => handleChange("diastolicBP", e.target.value)}
                      className={inputCls(!!errors.diastolicBP)}
                    />
                  </Field>
                  <Field label="Resp. Rate (/min)" error={errors.respiratoryRate}>
                    <input
                      type="number"
                      value={values.respiratoryRate}
                      onChange={(e) => handleChange("respiratoryRate", e.target.value)}
                      className={inputCls(!!errors.respiratoryRate)}
                    />
                  </Field>
                  <Field label="SpO₂ (%)" error={errors.oxygenSaturation}>
                    <input
                      type="number"
                      value={values.oxygenSaturation}
                      onChange={(e) => handleChange("oxygenSaturation", e.target.value)}
                      className={inputCls(!!errors.oxygenSaturation)}
                    />
                  </Field>
                  <Field label="Temperature (°C)" error={errors.temperature}>
                    <input
                      type="number"
                      step="0.1"
                      value={values.temperature}
                      onChange={(e) => handleChange("temperature", e.target.value)}
                      className={inputCls(!!errors.temperature)}
                    />
                  </Field>
                  <Field label="GCS (3–15)" error={errors.consciousnessScore} className="col-span-2">
                    <input
                      type="number"
                      min={3}
                      max={15}
                      value={values.consciousnessScore}
                      onChange={(e) => handleChange("consciousnessScore", e.target.value)}
                      className={inputCls(!!errors.consciousnessScore)}
                    />
                  </Field>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[#1e2d4a] px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
            >
              <UserPlus className="h-4 w-4" />
              Admit Patient
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function inputCls(hasError: boolean) {
  return cn(
    "w-full rounded-lg border bg-[#080c18] px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30",
    hasError ? "border-red-500/60" : "border-[#1e2d4a]"
  );
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label className="text-xs font-medium text-gray-400">{label}</label>
      {children}
      {error && <p className="text-[10px] text-red-400">{error}</p>}
    </div>
  );
}
