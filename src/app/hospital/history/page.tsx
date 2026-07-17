import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CheckCircle2, XCircle, Clock, Building2, TrendingUp } from "lucide-react";

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("hospital_id").eq("id", user.id).single();
  if (!profile?.hospital_id) redirect("/hospital");

  const { data: decisions } = await supabase
    .from("decisions")
    .select("*, request:emergency_requests(patient_token,severity,needed_resources), winning_hospital:hospitals(name,city)")
    .or(`request.hospital_id.eq.${profile.hospital_id},winning_hospital_id.eq.${profile.hospital_id}`)
    .order("decided_at", { ascending: false })
    .limit(50);

  const { data: negotiations } = await supabase
    .from("negotiations")
    .select("*, request:emergency_requests(patient_token,severity), winning_hospital:hospitals(name,city)")
    .or(`requesting_hospital_id.eq.${profile.hospital_id},winning_hospital_id.eq.${profile.hospital_id}`)
    .order("started_at", { ascending: false })
    .limit(30);

  const completed = (negotiations || []).filter((n: Record<string, unknown>) => n.status === "COMPLETED").length;
  const failed    = (negotiations || []).filter((n: Record<string, unknown>) => n.status === "FAILED").length;
  const rate      = (negotiations || []).length > 0 ? Math.round((completed / (negotiations || []).length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Allocation History</h2>
        <p className="text-sm text-gray-500 mt-0.5">Past negotiations and AI decisions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Negotiations",  value: (negotiations || []).length, color: "text-gray-900"  },
          { label: "Successful",          value: completed,                   color: "text-green-600" },
          { label: "AI Success Rate",     value: `${rate}%`,                  color: "text-blue-600"  },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Decisions table */}
      {decisions && decisions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">AI Allocation Decisions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Patient</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Severity</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Allocated To</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Score</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Decision Time</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {decisions.map((d: Record<string, unknown>) => {
                  const req = d.request as Record<string, unknown> | null;
                  const wh  = d.winning_hospital as Record<string, unknown> | null;
                  return (
                    <tr key={String(d.id)} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-mono text-gray-900">{req ? String(req.patient_token) : "—"}</td>
                      <td className="px-6 py-3">
                        {req && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            req.severity === "CRITICAL" ? "bg-red-50 text-red-700" :
                            req.severity === "HIGH"     ? "bg-amber-50 text-amber-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {String(req.severity)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {wh ? (
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-gray-800">{String(wh.name)}</span>
                          </div>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-6 py-3">
                        {d.confidence_score ? (
                          <span className="font-bold text-green-600">{String(d.confidence_score)}%</span>
                        ) : "—"}
                      </td>
                      <td className="px-6 py-3 text-gray-500">
                        {d.decision_time_ms ? `${String(d.decision_time_ms)}ms` : "—"}
                      </td>
                      <td className="px-6 py-3 text-xs text-gray-400">
                        {new Date(String(d.decided_at)).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Negotiations list */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Negotiation Log</h3>
        </div>
        {(negotiations || []).length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">No negotiations yet</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {(negotiations || []).map((n: Record<string, unknown>) => {
              const req = n.request as Record<string, unknown> | null;
              const wh  = n.winning_hospital as Record<string, unknown> | null;
              return (
                <div key={String(n.id)} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50">
                  <div>
                    {n.status === "COMPLETED" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    {n.status === "FAILED"    && <XCircle      className="w-4 h-4 text-red-500" />}
                    {n.status === "IN_PROGRESS" && <Clock      className="w-4 h-4 text-blue-500 animate-pulse" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-mono text-gray-900">{req ? String(req.patient_token) : "—"}</p>
                    {wh && <p className="text-xs text-gray-400">→ {String(wh.name)}, {String(wh.city)}</p>}
                    {Boolean(n.summary) && <p className="text-xs text-gray-400 italic mt-0.5">{String(n.summary).slice(0, 80)}…</p>}
                  </div>
                  <div className="flex items-center gap-2 text-right shrink-0">
                    {Boolean(n.overall_score) && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-[#1976D2]" />
                        <span className="text-sm font-bold text-[#1976D2]">{String(n.overall_score)}%</span>
                      </div>
                    )}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      n.status === "COMPLETED" ? "bg-green-50 text-green-700" :
                      n.status === "FAILED"    ? "bg-red-50 text-red-700" :
                      "bg-blue-50 text-blue-700"
                    }`}>
                      {String(n.status)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
