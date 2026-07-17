import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BedDouble, Wind, Stethoscope, Ambulance,
  AlertTriangle, GitBranch, Plus, TrendingUp,
  Clock, CheckCircle2, XCircle, Activity,
} from "lucide-react";

export default async function HospitalDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, hospital:hospitals(*)")
    .eq("id", user.id)
    .single();

  if (!profile?.hospital_id) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8 bg-white rounded-2xl border border-gray-200 shadow-sm max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Hospital Assigned</h2>
          <p className="text-gray-500 text-sm">
            Your account is not linked to a hospital yet. Please contact your Platform Administrator.
          </p>
        </div>
      </div>
    );
  }

  const hospitalId = profile.hospital_id;

  const [resourcesRes, requestsRes, negotiationsRes] = await Promise.all([
    supabase.from("resources").select("*").eq("hospital_id", hospitalId),
    supabase.from("emergency_requests").select("*").eq("hospital_id", hospitalId).order("created_at", { ascending: false }).limit(10),
    supabase.from("negotiations").select("*, request:emergency_requests(severity,patient_token,needed_resources)").eq("requesting_hospital_id", hospitalId).in("status", ["IN_PROGRESS"]).limit(5),
  ]);

  const resources    = resourcesRes.data    || [];
  const requests     = requestsRes.data     || [];
  const negotiations = negotiationsRes.data || [];

  const hospital = profile.hospital as Record<string, unknown>;

  const icuBeds     = resources.filter(r => r.type === "ICU_BED");
  const ventilators = resources.filter(r => r.type === "VENTILATOR");
  const doctors     = resources.filter(r => r.type === "DOCTOR" || r.type === "SPECIALIST");
  const ambulances  = resources.filter(r => r.type === "AMBULANCE");

  const avail = (arr: typeof resources) => arr.filter(r => r.status === "AVAILABLE").length;

  const activeRequests = requests.filter(r => ["PENDING","NEGOTIATING","ALLOCATED"].includes(r.status));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{String(hospital?.name || "Hospital Dashboard")}</h2>
          <p className="text-sm text-gray-500 mt-0.5">Emergency Resource Command Center</p>
        </div>
        <Link
          href="/hospital/emergency/new"
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Emergency Request
        </Link>
      </div>

      {/* Resource KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "ICU Beds",    avail: avail(icuBeds),     total: icuBeds.length,     icon: BedDouble,    color: "#1976D2", bg: "#EFF6FF", border: "#BFDBFE" },
          { label: "Ventilators", avail: avail(ventilators), total: ventilators.length, icon: Wind,         color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
          { label: "Doctors",     avail: avail(doctors),     total: doctors.length,     icon: Stethoscope,  color: "#0D9488", bg: "#F0FDF4", border: "#BBF7D0" },
          { label: "Ambulances",  avail: avail(ambulances),  total: ambulances.length,  icon: Ambulance,    color: "#EA580C", bg: "#FFF7ED", border: "#FED7AA" },
        ].map(({ label, avail: a, total, icon: Icon, color, bg, border }) => {
          const pct = total > 0 ? Math.round((a / total) * 100) : 0;
          const status = pct >= 50 ? "good" : pct >= 25 ? "warn" : "crit";
          return (
            <div key={label} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg, border: `1px solid ${border}` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  status === "good" ? "bg-green-50 text-green-700" :
                  status === "warn" ? "bg-amber-50 text-amber-700" :
                  "bg-red-50 text-red-700"
                }`}>
                  {pct}% free
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{a}<span className="text-sm font-normal text-gray-400">/{total}</span></p>
              <p className="text-xs text-gray-500 mb-2">{label} available</p>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full score-bar-fill"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: status === "good" ? "#22C55E" : status === "warn" ? "#F59E0B" : "#DC2626"
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Active emergency + negotiation alerts */}
      {(activeRequests.length > 0 || negotiations.length > 0) && (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Active requests alert */}
          {activeRequests.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-semibold text-red-800">{activeRequests.length} Active Emergency Request{activeRequests.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="space-y-2">
                {activeRequests.slice(0, 3).map((r) => (
                  <div key={r.id} className="flex items-center justify-between bg-white rounded-xl border border-red-100 px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                        r.severity === "CRITICAL" ? "bg-red-50 text-red-700 border-red-200" :
                        r.severity === "HIGH"     ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-blue-50 text-blue-700 border-blue-200"
                      }`}>
                        {r.severity}
                      </span>
                      <span className="text-xs text-gray-600 font-mono">{r.patient_token}</span>
                    </div>
                    <span className={`text-xs font-medium ${
                      r.status === "NEGOTIATING" ? "text-purple-600" : "text-blue-600"
                    }`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
              <Link href="/hospital/emergency" className="mt-3 block text-center text-xs font-semibold text-red-700 hover:text-red-800">
                View all →
              </Link>
            </div>
          )}

          {/* Active negotiations */}
          {negotiations.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-purple-600 animate-pulse" />
                <span className="text-sm font-semibold text-purple-800">AI Negotiating — {negotiations.length} active</span>
              </div>
              <div className="space-y-2">
                {negotiations.map((n: Record<string, unknown>) => {
                  const req = n.request as Record<string, unknown> | null;
                  return (
                    <div key={String(n.id)} className="flex items-center justify-between bg-white rounded-xl border border-purple-100 px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-3.5 h-3.5 text-purple-500" />
                        <span className="text-xs font-mono text-gray-600">{req ? String(req.patient_token) : "—"}</span>
                      </div>
                      <span className="text-xs font-semibold text-purple-700 animate-pulse">IN PROGRESS</span>
                    </div>
                  );
                })}
              </div>
              <Link href="/hospital/negotiation" className="mt-3 block text-center text-xs font-semibold text-purple-700 hover:text-purple-800">
                Live negotiation view →
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent requests table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Emergency Requests</h3>
            <Link href="/hospital/emergency" className="text-xs text-[#1976D2] font-medium hover:underline">View all</Link>
          </div>
          {requests.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-gray-400">
              No emergency requests yet
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {requests.slice(0, 6).map((r) => (
                <div key={r.id} className={`flex items-center gap-4 px-6 py-3 ${r.severity === "CRITICAL" ? "critical-row" : "hover:bg-gray-50"} transition-colors`}>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                    r.severity === "CRITICAL" ? "bg-red-50 text-red-700 border-red-200" :
                    r.severity === "HIGH"     ? "bg-amber-50 text-amber-700 border-amber-200" :
                    r.severity === "MODERATE" ? "bg-blue-50 text-blue-700 border-blue-200" :
                    "bg-green-50 text-green-700 border-green-200"
                  }`}>
                    {r.severity}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono text-gray-900">{r.patient_token}</p>
                    <p className="text-xs text-gray-400">{(r.needed_resources as string[]).join(", ")}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {r.status === "COMPLETED"   && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                    {r.status === "CANCELLED"   && <XCircle      className="w-3.5 h-3.5 text-gray-400" />}
                    {r.status === "NEGOTIATING" && <Activity     className="w-3.5 h-3.5 text-purple-500 animate-pulse" />}
                    {r.status === "PENDING"     && <Clock        className="w-3.5 h-3.5 text-amber-500" />}
                    {r.status === "ALLOCATED"   && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />}
                    <span className="text-xs text-gray-500">{r.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/hospital/emergency/new",  label: "New Emergency",    icon: Plus,         color: "bg-red-50 border-red-200 text-red-700 hover:bg-red-100" },
              { href: "/hospital/resources",      label: "Update Resources", icon: Database_,    color: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100" },
              { href: "/hospital/negotiation",    label: "Live Negotiation", icon: GitBranch,    color: "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100" },
              { href: "/hospital/history",        label: "View History",     icon: TrendingUp,   color: "bg-green-50 border-green-200 text-green-700 hover:bg-green-100" },
            ].map(({ href, label, icon: Icon, color }) => (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${color}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-semibold text-center">{label}</span>
              </Link>
            ))}
          </div>

          {/* Resource summary */}
          <div className="mt-5 pt-5 border-t border-gray-100">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Resource Health</h4>
            {[
              { label: "ICU Beds",    n: avail(icuBeds),     t: icuBeds.length },
              { label: "Ventilators", n: avail(ventilators), t: ventilators.length },
              { label: "Ambulances",  n: avail(ambulances),  t: ambulances.length },
            ].map(({ label, n, t }) => (
              <div key={label} className="flex items-center gap-3 mb-2">
                <span className="text-xs text-gray-500 w-24 shrink-0">{label}</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#1976D2] score-bar-fill"
                    style={{ width: t > 0 ? `${(n / t) * 100}%` : "0%" }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700 w-10 text-right">{n}/{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Database_({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
    </svg>
  );
}
