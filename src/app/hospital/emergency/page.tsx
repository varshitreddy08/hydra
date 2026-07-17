import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, AlertTriangle, Clock, CheckCircle2, XCircle, Activity, Eye, CalendarDays } from "lucide-react";
import type { EmergencyRequest } from "@/types";
import { DeleteRequestButton } from "@/components/hospital/DeleteRequestButton";

function groupByDate(requests: EmergencyRequest[]): { label: string; items: EmergencyRequest[] }[] {
  const map = new Map<string, EmergencyRequest[]>();
  const today     = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  for (const r of requests) {
    const d = new Date(r.created_at).toDateString();
    const label =
      d === today     ? "Today" :
      d === yesterday ? "Yesterday" :
      new Date(r.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(r);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

const severityOrder = { CRITICAL: 0, HIGH: 1, MODERATE: 2, LOW: 3 };

export default async function EmergencyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("hospital_id, role").eq("id", user.id).single();

  if (!profile?.hospital_id) redirect("/hospital");

  const { data } = await supabase
    .from("emergency_requests")
    .select("*")
    .eq("hospital_id", profile.hospital_id)
    .order("created_at", { ascending: false });

  const requests = (data || []) as EmergencyRequest[];
  const active   = requests.filter(r => ["PENDING","NEGOTIATING","ALLOCATED"].includes(r.status))
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  const past     = requests.filter(r => ["COMPLETED","TRANSFERRED","CANCELLED"].includes(r.status));
  const grouped  = groupByDate(past);

  const canCreate = ["hospital_admin","emergency_doctor"].includes(profile.role);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Emergency Requests</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {active.length} active · {past.length} completed
          </p>
        </div>
        {canCreate && (
          <Link
            href="/hospital/emergency/new"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Request
          </Link>
        )}
      </div>

      {/* Active requests */}
      {active.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 bg-red-50">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-semibold text-red-800">Active Requests ({active.length})</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {active.map((r) => (
              <div key={r.id} className={`px-6 py-4 ${r.severity === "CRITICAL" ? "critical-row" : "hover:bg-gray-50"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                      r.severity === "CRITICAL" ? "bg-red-50 text-red-700 border-red-200" :
                      r.severity === "HIGH"     ? "bg-amber-50 text-amber-700 border-amber-200" :
                      r.severity === "MODERATE" ? "bg-blue-50 text-blue-700 border-blue-200" :
                      "bg-green-50 text-green-700 border-green-200"
                    }`}>
                      {r.severity}
                    </span>
                    <span className="text-sm font-mono font-semibold text-gray-900">{r.patient_token}</span>
                    {r.blood_group && r.blood_group !== "UNKNOWN" && (
                      <span className="text-xs px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full font-medium">
                        {r.blood_group}
                      </span>
                    )}
                    {r.eta_minutes && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        ETA {r.eta_minutes} min
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${
                      r.status === "NEGOTIATING"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : r.status === "ALLOCATED"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {r.status === "NEGOTIATING" && <Activity className="w-3 h-3 animate-pulse" />}
                      {r.status === "PENDING"     && <Clock className="w-3 h-3" />}
                      {r.status === "ALLOCATED"   && <CheckCircle2 className="w-3 h-3" />}
                      {r.status}
                    </span>
                    <Link href={`/hospital/emergency/${r.id}`} className="text-xs text-[#1976D2] hover:underline flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </Link>
                    {canCreate && <DeleteRequestButton id={r.id} token={r.patient_token} />}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.needed_resources.map((res: string) => (
                    <span key={res} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">
                      {res.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
                {r.clinical_note && (
                  <p className="mt-1.5 text-xs text-gray-500 italic">Note: {r.clinical_note}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {active.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <p className="text-sm font-semibold text-green-800">No active emergency requests</p>
          <p className="text-xs text-green-600 mt-1">All clear — create a new request when needed</p>
        </div>
      )}

      {/* Past requests — grouped by date */}
      {grouped.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">History by Date ({past.length} total)</h3>
          </div>

          {grouped.map(({ label, items }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Date header */}
              <div className="flex items-center gap-2 px-6 py-3 bg-gray-50 border-b border-gray-100">
                <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-semibold text-gray-600">{label}</span>
                <span className="ml-auto text-xs text-gray-400">{items.length} request{items.length !== 1 ? "s" : ""}</span>
              </div>

              <div className="divide-y divide-gray-50">
                {items.map((r) => (
                  <div key={r.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                      r.severity === "CRITICAL" ? "bg-red-50 text-red-700 border-red-200" :
                      r.severity === "HIGH"     ? "bg-amber-50 text-amber-700 border-amber-200" :
                      r.severity === "MODERATE" ? "bg-blue-50 text-blue-700 border-blue-200" :
                      "bg-green-50 text-green-700 border-green-200"
                    }`}>
                      {r.severity}
                    </span>
                    <span className="font-mono text-sm text-gray-900">{r.patient_token}</span>
                    <div className="flex-1 flex flex-wrap gap-1">
                      {(r.needed_resources as string[]).map(res => (
                        <span key={res} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">
                          {res.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {new Date(r.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className={`flex items-center gap-1 text-xs font-medium shrink-0 ${
                      r.status === "COMPLETED"   ? "text-green-600" :
                      r.status === "TRANSFERRED" ? "text-blue-600"  :
                      "text-gray-400"
                    }`}>
                      {r.status === "COMPLETED"   && <CheckCircle2 className="w-3 h-3" />}
                      {r.status === "TRANSFERRED" && <CheckCircle2 className="w-3 h-3" />}
                      {r.status === "CANCELLED"   && <XCircle      className="w-3 h-3" />}
                      {r.status}
                    </span>
                    <Link href={`/hospital/emergency/${r.id}`} className="text-xs text-[#1976D2] hover:underline flex items-center gap-1 shrink-0">
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                    {canCreate && <DeleteRequestButton id={r.id} token={r.patient_token} />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
