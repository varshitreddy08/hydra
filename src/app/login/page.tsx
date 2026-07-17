"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Lock, Mail, AlertCircle, HeartPulse } from "lucide-react";

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
        <div className="hidden lg:flex flex-col bg-gradient-to-br from-[#1565C0] to-[#1976D2] p-10 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">MedResponse</p>
              <p className="text-blue-200 text-xs">Emergency Resource Network</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold leading-tight mt-8">
            AI-Powered Emergency<br />Resource Allocation
          </h2>

          {/* Animated hospital network */}
          <div className="flex-1 flex items-center justify-center py-4">
            <svg viewBox="0 0 280 220" className="w-full max-w-[280px]">
              {/* Outer glow rings */}
              <circle cx="140" cy="110" r="55" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="28" />
              <circle cx="140" cy="110" r="82" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="18" />

              {/* Connection lines */}
              <line x1="140" y1="110" x2="140" y2="18"  stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeDasharray="4 3" />
              <line x1="140" y1="110" x2="232" y2="60"  stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeDasharray="4 3" />
              <line x1="140" y1="110" x2="220" y2="175" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeDasharray="4 3" />
              <line x1="140" y1="110" x2="60"  y2="175" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeDasharray="4 3" />
              <line x1="140" y1="110" x2="48"  y2="60"  stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeDasharray="4 3" />

              {/* Animated resource packets */}
              <circle r="3.5" fill="rgba(255,255,255,0.95)">
                <animateMotion dur="2.0s" repeatCount="indefinite" begin="0s"   path="M140,110 L140,18" />
              </circle>
              <circle r="3.5" fill="rgba(255,220,80,0.95)">
                <animateMotion dur="1.8s" repeatCount="indefinite" begin="0.4s" path="M232,60 L140,110" />
              </circle>
              <circle r="3.5" fill="rgba(100,255,160,0.95)">
                <animateMotion dur="2.3s" repeatCount="indefinite" begin="0.8s" path="M140,110 L220,175" />
              </circle>
              <circle r="3.5" fill="rgba(255,255,255,0.95)">
                <animateMotion dur="1.9s" repeatCount="indefinite" begin="1.2s" path="M60,175 L140,110" />
              </circle>
              <circle r="3.5" fill="rgba(255,140,80,0.95)">
                <animateMotion dur="2.1s" repeatCount="indefinite" begin="0.6s" path="M140,110 L48,60" />
              </circle>

              {/* Hospital nodes */}
              <circle cx="140" cy="18"  r="15" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" />
              <text x="140" y="14"  textAnchor="middle" fill="white" fontSize="6.5" fontWeight="700">AIIMS</text>
              <text x="140" y="23"  textAnchor="middle" fill="rgba(255,255,255,0.65)" fontSize="5">Hyderabad</text>

              <circle cx="232" cy="60"  r="15" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" />
              <text x="232" y="56"  textAnchor="middle" fill="white" fontSize="6.5" fontWeight="700">Apollo</text>
              <text x="232" y="65"  textAnchor="middle" fill="rgba(255,255,255,0.65)" fontSize="5">Jubilee</text>

              <circle cx="220" cy="175" r="15" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" />
              <text x="220" y="171" textAnchor="middle" fill="white" fontSize="6.5" fontWeight="700">Yashoda</text>
              <text x="220" y="180" textAnchor="middle" fill="rgba(255,255,255,0.65)" fontSize="5">Secunder.</text>

              <circle cx="60"  cy="175" r="15" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" />
              <text x="60"  y="171" textAnchor="middle" fill="white" fontSize="6.5" fontWeight="700">Care</text>
              <text x="60"  y="180" textAnchor="middle" fill="rgba(255,255,255,0.65)" fontSize="5">Banjara</text>

              <circle cx="48"  cy="60"  r="15" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" />
              <text x="48"  y="56"  textAnchor="middle" fill="white" fontSize="6.5" fontWeight="700">KIMS</text>
              <text x="48"  y="65"  textAnchor="middle" fill="rgba(255,255,255,0.65)" fontSize="5">Gachi.</text>

              {/* Central AI node */}
              <circle cx="140" cy="110" r="32" fill="rgba(255,255,255,0.07)" />
              <circle cx="140" cy="110" r="25" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
              <text x="140" y="106" textAnchor="middle" fill="white" fontSize="8.5" fontWeight="800" letterSpacing="0.5">HYDRA</text>
              <text x="140" y="118" textAnchor="middle" fill="rgba(255,255,255,0.75)" fontSize="6">AI ENGINE</text>
            </svg>
          </div>

          {/* Status bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-blue-100">Network Live</span>
            </div>
            <span className="text-white/20">|</span>
            {[
              "Explainable AI",
              "Tenant Isolated",
              "Real-time Sync",
            ].map((tag) => (
              <span key={tag} className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-blue-100 border border-white/15">
                {tag}
              </span>
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

        </div>
      </div>
    </div>
  );
}
