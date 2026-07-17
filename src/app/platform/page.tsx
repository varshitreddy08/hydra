import { createClient } from "@/lib/supabase/server";
import {
  Building2, Activity, AlertTriangle, CheckCircle2,
  TrendingUp, Clock, Cpu, Users, XCircle
} from "lucide-react";
import Link from "next/link";

export default async function PlatformDashboard() {
  const supabase = await createClient();

  const [hospitalsRes, requestsRes, negotiationsRes] = await Promise.all([
    supabase.from("hospitals").select("id, name, status, tier, city, state, total_icu_beds, total_ventilators, total_doctors, total_ambulances, created_at"),
    supabase.from("emergency_requests").select("id, severity, status, created_at").gte("created_at", new Date(Date.now() - 86400000).toISOString()),
    supabase.from("negotiations").select("id, status").gte("started_at", new Date(Date.now() - 86400000).toISOString()),
  ]);

  const hospitals     = hospitalsRes.data  || [];
  const requests      = requestsRes.data   || [];
  const negotiations  = negotiationsRes.data || [];

  const active    = hospitals.filter(h => h.status === "active").length;
  const pending   = hospitals.filter(h => h.status === "pending").length;
  const suspended = hospitals.filter(h => h.status === "suspended").length;

  const criticalRequests  = requests.filter(r => r.severity === "CRITICAL").length;
  const completedNegs     = negotiations.filter(n => n.status === "COMPLETED").length;
  const successRate        = negotiations.length > 0
    ? Math.round((completedNegs / negotiations.length) * 100)
    : 0;

  const kpis = [
    { label: "Total Hospitals",           value: hospitals.length,   icon: Building2,    color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200" },
    { label: "Active Hospitals",          value: active,             icon: CheckCircle2, color: "text-green-600",  bg: "bg-green-50",  border: "border-green-200" },
    { label: "Pending Approval",          value: pending,            icon: Clock,        color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-200" },
    { label: "Critical Requests Today",   value: criticalRequests,   icon: AlertTriangle,color: "text-red-600",    bg: "bg-red-50",    border: "border-red-200" },
    { label: "Emergency Requests Today",  value: requests.length,    icon: Activity,     color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
    { label: "AI Success Rate",           value: `${successRate}%`,  icon: TrendingUp,   color: "text-teal-600",   bg: "bg-teal-50",   border: "border-teal-200" },
  ];

  const recentHospitals = [...hospitals]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Platform Dashboard</h2>
          <p className="text-sm text-gray-500 mt-0.5">System overview — no patient data accessible</p>
        </div>
        <Link
          href="/platform/hospitals"
          className="inline-flex items-center gap-2 bg-[#1976D2] hover:bg-[#1565C0] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Building2 className="w-4 h-4" />
          Manage Hospitals
        </Link>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={`bg-white rounded-2xl border ${border} p-5 shadow-sm`}>
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Privacy notice */}
      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-start gap-3">
        <Cpu className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-purple-800">Platform Admin — Data Access Policy</p>
          <p className="text-xs text-purple-600 mt-0.5">
            You have access to platform infrastructure and hospital management only.
            Patient records, medical histories, and individual clinical data remain isolated within each hospital tenant.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Hospital overview */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Hospital Network</h3>
            <Link href="/platform/hospitals" className="text-xs text-[#1976D2] hover:underline font-medium">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentHospitals.map((h) => (
              <div key={h.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{h.name}</p>
                  <p className="text-xs text-gray-400">{h.city}, {h.state}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                    h.status === "active"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : h.status === "pending"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}>
                    {h.status === "active" && <CheckCircle2 className="w-3 h-3" />}
                    {h.status === "pending" && <Clock className="w-3 h-3" />}
                    {h.status === "suspended" && <XCircle className="w-3 h-3" />}
                    {h.status}
                  </span>
                </div>
              </div>
            ))}
            {recentHospitals.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-gray-400">
                No hospitals registered yet
              </div>
            )}
          </div>
        </div>

        {/* Resource summary */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Network Resource Summary</h3>
            <p className="text-xs text-gray-400 mt-0.5">Aggregated across all active hospitals</p>
          </div>
          <div className="p-6 space-y-4">
            {[
              {
                label: "ICU Beds",
                total: hospitals.reduce((s, h) => s + (h.total_icu_beds || 0), 0),
                icon: "🛏",
                color: "bg-blue-500",
              },
              {
                label: "Ventilators",
                total: hospitals.reduce((s, h) => s + (h.total_ventilators || 0), 0),
                icon: "🫁",
                color: "bg-purple-500",
              },
              {
                label: "Doctors",
                total: hospitals.reduce((s, h) => s + (h.total_doctors || 0), 0),
                icon: "👨‍⚕️",
                color: "bg-teal-500",
              },
              {
                label: "Ambulances",
                total: hospitals.reduce((s, h) => s + (h.total_ambulances || 0), 0),
                icon: "🚑",
                color: "bg-orange-500",
              },
            ].map(({ label, total, icon, color }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xl w-8 text-center">{icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">{label}</span>
                    <span className="text-xs font-bold text-gray-900">{total}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full score-bar-fill`} style={{ width: `${Math.min((total / 200) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="px-6 pb-5 grid grid-cols-2 gap-2">
            <Link
              href="/platform/hospitals?filter=pending"
              className="flex items-center justify-center gap-2 py-2 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-medium transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              Approve Pending ({pending})
            </Link>
            <Link
              href="/platform/analytics"
              className="flex items-center justify-center gap-2 py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-medium transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              View Analytics
            </Link>
          </div>
        </div>
      </div>

      {/* Today's emergency summary (aggregate only, no patient data) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Today&apos;s Emergency Activity — Aggregate Summary
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Requests",    value: requests.length,                                         color: "text-gray-900" },
            { label: "Critical",          value: requests.filter(r => r.severity === "CRITICAL").length,  color: "text-red-600" },
            { label: "High Priority",     value: requests.filter(r => r.severity === "HIGH").length,      color: "text-amber-600" },
            { label: "Completed",         value: requests.filter(r => r.status === "COMPLETED").length,   color: "text-green-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4 italic">
          ℹ Patient names, medical histories, and individual records are not accessible to Platform Administrators.
        </p>
      </div>
    </div>
  );
}
