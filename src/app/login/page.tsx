"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Activity, Lock, Mail, AlertCircle, HeartPulse, Shield } from "lucide-react";

let lastAttemptAt = 0;
const MIN_ATTEMPT_GAP_MS = 2000;

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const now = Date.now();
    if (now - lastAttemptAt < MIN_ATTEMPT_GAP_MS) return;
    lastAttemptAt = now;

    const cleanEmail    = email.trim().toLowerCase().slice(0, 254);
    const cleanPassword = password.slice(0, 128);

    if (!cleanEmail || !cleanPassword) { setError("Email and password are required"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) { setError("Invalid email address"); return; }

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
      } else {
        setError(`Unexpected error: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E3F2FD] via-[#F5F7FA] to-[#EDE9FE] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-0 bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* Left panel — branding */}
        <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-[#1565C0] to-[#1976D2] p-10 text-white">
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <HeartPulse className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-lg leading-tight">MedResponse</p>
                <p className="text-blue-200 text-xs">Emergency Resource Network</p>
              </div>
            </div>

            <h2 className="text-3xl font-bold leading-tight mb-4">
              AI-Powered Emergency<br />Resource Allocation
            </h2>
            <p className="text-blue-100 text-sm leading-relaxed">
              Multi-agent negotiation platform for real-time hospital resource reallocation across the network.
            </p>

            {/* Feature list */}
            <div className="mt-8 space-y-3">
              {[
                "Multi-hospital AI negotiation",
                "Explainable allocation decisions",
                "Real-time resource tracking",
                "Secure tenant isolation",
              ].map((f) => (
                <div key={f} className="flex items-center gap-3 text-sm text-blue-100">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Activity className="w-3 h-3 text-white" />
                  </div>
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Hospitals", value: "250+" },
              { label: "AI Success Rate", value: "96%" },
              { label: "Avg Response", value: "2.8 min" },
              { label: "Requests Today", value: "430" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 rounded-xl p-3">
                <p className="text-xl font-bold">{value}</p>
                <p className="text-blue-200 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — login form */}
        <div className="flex flex-col justify-center p-8 lg:p-12">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#1976D2] flex items-center justify-center">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900">MedResponse</p>
              <p className="text-gray-500 text-xs">Emergency Resource Network</p>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-gray-500 text-sm mt-1">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@hospital.com"
                  autoComplete="email"
                  className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all text-sm bg-gray-50 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/20 transition-all text-sm bg-gray-50 focus:bg-white"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1976D2] hover:bg-[#1565C0] disabled:bg-[#90CAF9] disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 mt-2 shadow-sm"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Authenticating…
                </>
              ) : "Sign in"}
            </button>
          </form>

          {/* Role info */}
          <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-gray-400" />
              <p className="text-xs font-medium text-gray-600">Access by role</p>
            </div>
            <div className="space-y-1.5">
              {[
                { role: "Platform Admin",    desc: "Manage hospitals & platform", color: "bg-purple-100 text-purple-700" },
                { role: "Hospital Admin",    desc: "Manage hospital resources",   color: "bg-blue-100 text-blue-700" },
                { role: "Resource Manager",  desc: "Update resource availability",color: "bg-green-100 text-green-700" },
                { role: "Emergency Doctor",  desc: "Create & manage requests",    color: "bg-orange-100 text-orange-700" },
              ].map(({ role, desc, color }) => (
                <div key={role} className="flex items-center gap-2 text-xs">
                  <span className={`px-2 py-0.5 rounded-full font-medium ${color}`}>{role}</span>
                  <span className="text-gray-500">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
