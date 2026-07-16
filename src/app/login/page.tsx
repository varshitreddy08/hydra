"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Activity, Lock, Mail, AlertCircle, Building2 } from "lucide-react";

// Simple client-side rate limiting — prevents rapid resubmission
let lastAttemptAt = 0;
const MIN_ATTEMPT_GAP_MS = 2000;

export default function LoginPage() {
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

    // Strict input validation
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

      router.push("/");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("fetch") || msg.includes("network") || msg.includes("Failed")) {
        setError("Cannot reach the server. Check your internet connection.");
      } else if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        setError("App not configured — Supabase environment variables are missing.");
      } else {
        setError(`Unexpected error: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080c18] flex items-center justify-center p-4">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(#1e2d4a 1px, transparent 1px), linear-gradient(90deg, #1e2d4a 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 mb-4">
            <Activity className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">MedNegotiate</h1>
          <p className="text-slate-400 text-sm mt-1">
            Emergency Resource Allocation Platform
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#111b2e] border border-[#1e2d4a] rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-6">
            Sign in to continue
          </h2>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-6 text-red-300 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@hospital.demo"
                  autoComplete="email"
                  className="w-full bg-[#0d1526] border border-[#1e2d4a] rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-[#0d1526] border border-[#1e2d4a] rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Authenticating…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#1e2d4a] space-y-3">
            <p className="text-xs text-slate-500 text-center">
              Operations & Admin access only
            </p>
            <Link
              href="/hospital-login"
              className="flex items-center justify-center gap-2 w-full py-2.5 border border-[#1e2d4a] hover:border-blue-500/40 hover:bg-blue-500/5 text-slate-400 hover:text-blue-300 rounded-lg text-xs font-medium transition-colors"
            >
              <Building2 className="w-3.5 h-3.5" />
              Hospital Staff? Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
