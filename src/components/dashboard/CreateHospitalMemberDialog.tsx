"use client";

import { useState } from "react";
import { X, UserPlus, Building2, Eye, EyeOff } from "lucide-react";
import { useSimulationStore } from "@/lib/store/simulationStore";
import { cn } from "@/lib/utils/cn";

interface Props {
  open: boolean;
  onClose: () => void;
}

function inputCls(hasError: boolean) {
  return cn(
    "w-full rounded-lg border bg-[#080c18] px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30",
    hasError ? "border-red-500/60" : "border-[#1e2d4a]"
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-400">{label}</label>
      {children}
      {error && <p className="text-[10px] text-red-400">{error}</p>}
    </div>
  );
}

export function CreateHospitalMemberDialog({ open, onClose }: Props) {
  const { hospitals } = useSimulationStore();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hospitalId, setHospitalId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [serverError, setServerError] = useState("");

  if (!open) return null;

  function validate() {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = "Name is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email) || email.length > 254) errs.email = "Valid email required";
    if (password.length < 8 || password.length > 128) errs.password = "8–128 characters required";
    if (!hospitalId) errs.hospitalId = "Select a hospital";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(""); setSuccess("");
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const hospital = hospitals.find((h) => h.id === hospitalId) ?? null;
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          role: "hospital_member",
          fullName: fullName.trim(),
          hospitalId,
          // Send hospital data so the server can upsert it before writing the FK
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
      if (!res.ok) {
        setServerError(data.error ?? "Failed to create user");
      } else {
        const h = hospitals.find((h) => h.id === hospitalId);
        setSuccess(`Hospital staff account created for ${data.user.email} at ${h?.name ?? "hospital"}.`);
        setFullName(""); setEmail(""); setPassword(""); setHospitalId(""); setErrors({});
      }
    } catch {
      setServerError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setFullName(""); setEmail(""); setPassword(""); setHospitalId("");
    setErrors({}); setSuccess(""); setServerError("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-md bg-[#0d1526] border border-[#1e2d4a] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2d4a]">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Add Hospital Staff</h2>
          </div>
          <button onClick={handleClose} className="p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {serverError && (
            <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-300">
              {serverError}
            </div>
          )}
          {success && (
            <div className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-300">
              {success}
            </div>
          )}

          <Field label="Full Name" error={errors.fullName}>
            <input
              type="text"
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); setErrors((p) => { const n = {...p}; delete n.fullName; return n; }); }}
              placeholder="Dr. Jane Smith"
              className={inputCls(!!errors.fullName)}
            />
          </Field>

          <Field label="Email" error={errors.email}>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((p) => { const n = {...p}; delete n.email; return n; }); }}
              placeholder="staff@hospital.com"
              className={inputCls(!!errors.email)}
            />
          </Field>

          <Field label="Password" error={errors.password}>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((p) => { const n = {...p}; delete n.password; return n; }); }}
                placeholder="Min 8 characters"
                className={cn(inputCls(!!errors.password), "pr-9")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </Field>

          <Field label="Assign to Hospital" error={errors.hospitalId}>
            <select
              value={hospitalId}
              onChange={(e) => { setHospitalId(e.target.value); setErrors((p) => { const n = {...p}; delete n.hospitalId; return n; }); }}
              className={inputCls(!!errors.hospitalId)}
            >
              <option value="">Select hospital…</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
            {hospitals.length === 0 && (
              <p className="text-[10px] text-amber-400 mt-1">No hospitals registered yet. Add hospitals in the Resources tab first.</p>
            )}
          </Field>

          <div className="pt-1 text-[10px] text-slate-600 bg-[#080c18] border border-[#1e2d4a] rounded-lg px-3 py-2">
            Staff will log in at <span className="text-slate-400">/login</span> and be redirected to the hospital portal automatically.
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {loading ? "Creating…" : "Create Staff Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
