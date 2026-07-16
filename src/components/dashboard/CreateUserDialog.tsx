"use client";

import { useState } from "react";
import { X, UserPlus, ShieldCheck, Eye, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
}

interface FormState {
  fullName: string;
  email: string;
  password: string;
  role: "admin" | "viewer";
}

const DEFAULTS: FormState = {
  fullName: "",
  email: "",
  password: "",
  role: "viewer",
};

function generatePassword(): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => charset[b % charset.length])
    .join("");
}

export function CreateUserDialog({ open, onClose }: CreateUserDialogProps) {
  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ email: string; role: string } | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  if (!open) return null;

  function set(field: keyof FormState, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: undefined }));
    setApiError(null);
  }

  function validate(): boolean {
    const e: Partial<FormState> = {};
    if (!form.email.trim()) e.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    if (!form.password) e.password = "Required";
    else if (form.password.length < 8) e.password = "Minimum 8 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          password: form.password,
          role: form.role,
          fullName: form.fullName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setApiError(data.error ?? "Failed to create user");
        return;
      }

      setResult({ email: form.email.trim().toLowerCase(), role: form.role });
      setForm(DEFAULTS);
    } catch {
      setApiError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setForm(DEFAULTS);
    setErrors({});
    setApiError(null);
    setResult(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[#1e2d4a] bg-[#0d1526] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e2d4a] px-5 py-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-400" />
            <h2 className="text-base font-semibold text-white">Create User</h2>
          </div>
          <button onClick={handleClose} className="rounded-lg p-1.5 text-gray-500 hover:bg-white/10 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Success state */}
        {result ? (
          <div className="px-5 py-8 text-center">
            <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-white font-semibold text-lg mb-2">User Created</h3>
            <p className="text-slate-400 text-sm mb-1">
              <span className="text-white font-mono">{result.email}</span>
            </p>
            <span className={cn(
              "inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium border",
              result.role === "admin"
                ? "bg-red-500/10 border-red-500/30 text-red-300"
                : "bg-blue-500/10 border-blue-500/30 text-blue-300"
            )}>
              {result.role.toUpperCase()}
            </span>
            <p className="text-slate-500 text-xs mt-4">
              Profile automatically synced to database.
            </p>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setResult(null)}
                className="flex-1 px-4 py-2 bg-[#111b2e] border border-[#1e2d4a] text-slate-300 rounded-lg text-sm hover:border-slate-600 transition-colors"
              >
                Create Another
              </button>
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="px-5 py-4 space-y-4">
              {apiError && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2.5 text-red-300 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {apiError}
                </div>
              )}

              {/* Full name */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name (optional)</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  maxLength={100}
                  placeholder="Dr. Jane Smith"
                  className={inputCls(false)}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  maxLength={254}
                  placeholder="user@hospital.demo"
                  className={inputCls(!!errors.email)}
                />
                {errors.email && <p className="text-[10px] text-red-400 mt-1">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-400">Password</label>
                  <button
                    type="button"
                    onClick={() => set("password", generatePassword())}
                    className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Generate strong password
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    maxLength={128}
                    placeholder="Min 8 characters"
                    className={cn(inputCls(!!errors.password), "pr-10")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
                {errors.password && <p className="text-[10px] text-red-400 mt-1">{errors.password}</p>}
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["viewer", "admin"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => set("role", r)}
                      className={cn(
                        "px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-left",
                        form.role === r
                          ? r === "admin"
                            ? "bg-red-500/10 border-red-500/40 text-red-300"
                            : "bg-blue-500/10 border-blue-500/40 text-blue-300"
                          : "bg-[#111b2e] border-[#1e2d4a] text-slate-400 hover:border-slate-600"
                      )}
                    >
                      <div className="font-semibold capitalize">{r}</div>
                      <div className="text-[10px] opacity-70 mt-0.5">
                        {r === "admin" ? "Full control" : "Read-only access"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 border-t border-[#1e2d4a] px-5 py-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 text-sm text-slate-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                {loading ? "Creating…" : "Create User"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function inputCls(hasError: boolean) {
  return cn(
    "w-full rounded-lg border bg-[#080c18] px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30",
    hasError ? "border-red-500/60" : "border-[#1e2d4a]"
  );
}
