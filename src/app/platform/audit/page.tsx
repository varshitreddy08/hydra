import { createClient } from "@/lib/supabase/server";
import { ScrollText, Shield } from "lucide-react";

export default async function AuditPage() {
  const supabase = await createClient();
  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Logs</h2>
          <p className="text-sm text-gray-500 mt-0.5">Platform-level actions — no patient data</p>
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-start gap-3">
        <Shield className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
        <p className="text-xs text-purple-700">
          Audit logs record platform and hospital-level actions. Patient identifiers are anonymized tokens (e.g., P-2024-001).
          No medical records, names, or PII are stored in these logs.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
          <ScrollText className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Activity Log ({logs?.length || 0})</h3>
        </div>

        {(!logs || logs.length === 0) ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">No audit logs yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Time","User Role","Hospital","Action","Entity","Details"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        log.user_role === "platform_admin" ? "bg-purple-50 text-purple-700" :
                        log.user_role === "hospital_admin" ? "bg-blue-50 text-blue-700" :
                        log.user_role === "emergency_doctor" ? "bg-orange-50 text-orange-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {log.user_role || "system"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-600">{log.hospital_name || "—"}</td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-800">{log.action}</td>
                    <td className="px-5 py-3 text-xs text-gray-500">{log.entity_type || "—"}</td>
                    <td className="px-5 py-3 text-xs text-gray-400 max-w-xs truncate">
                      {log.entity_id || ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
