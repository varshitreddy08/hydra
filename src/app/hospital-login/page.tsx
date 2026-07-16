"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2, Lock, Mail, AlertCircle, Activity, ArrowRight, Shield,
} from "lucide-react";

let lastAttemptAt = 0;
const MIN_ATTEMPT_GAP_MS = 2000;

export default function HospitalLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const now = Date.now();
    if (now - lastAttemptAt < MIN_ATTEMPT_GAP_MS) return;
    lastAttemptAt = now;

    const cleanEmail = email.trim().toLowerCase().slice(0, 254);
    const cleanPassword = password.slice(0, 128);

    if (!cleanEmail || !cleanPassword) {
      setError("Email and password are required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Invalid email address");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (authError) {
        if (authError.message.toLowerCase().includes("invalid login")) {
          setError("Invalid email or password.");
        } else if (authError.message.toLowerCase().includes("email not confirmed")) {
          setError("Please confirm your email address before signing in.");
        } else {
          setError(authError.message || "Sign-in failed. Please try again.");
        }
        return;
      }

      router.push("/hospital-portal");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("fetch") || msg.includes("network") || msg.includes("Failed")) {
        setError("Cannot reach the server. Check your internet connection.");
      } else {
        setError("Unexpected error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ── Left panel: blue brand section ── */}
      <div className="lg:w-[45%] bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 flex flex-col justify-between p-10 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-8 w-40 h-40 rounded-full bg-blue-500/30" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg">MedNegotiate</span>
          </div>
          <p className="text-blue-200 text-sm ml-[52px]">Healthcare Resource Platform</p>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-6">
          <div>
            <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center mb-6">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white leading-tight mb-3">
              Hospital Staff<br />Portal
            </h1>
            <p className="text-blue-100 text-sm leading-relaxed max-w-xs">
              Manage your patients, track triage status, and coordinate referrals to other hospitals in real time.
            </p>
          </div>

          {/* Feature pills */}
          <div className="space-y-2.5">
            {[
              "View and manage admitted patients",
              "Monitor vitals & triage priority",
              "Recommend hospital referrals",
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <span className="text-blue-100 text-sm">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <div className="relative z-10 flex items-center gap-2 text-blue-200 text-xs">
          <Shield className="w-3.5 h-3.5" />
          <span>Secured with role-based access control</span>
        </div>
      </div>

      {/* ── Right panel: white login form ── */}
      <div className="flex-1 bg-white flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800">Hospital Staff Portal</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h2>
            <p className="text-slate-500 text-sm">Sign in to access your hospital dashboard</p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@hospital.com"
                  autoComplete="email"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm"
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 mt-2 shadow-md shadow-blue-600/20"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                <>
                  Sign in to Portal
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">NOT A HOSPITAL STAFF?</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Operations link */}
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full py-3 border-2 border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 font-medium rounded-xl text-sm transition-colors"
          >
            <Activity className="w-4 h-4" />
            Operations / Admin Login
          </Link>

          <p className="text-xs text-slate-400 text-center mt-6">
            Contact your administrator if you need access to the hospital portal.
          </p>
        </div>
      </div>
    </div>
  );
}
