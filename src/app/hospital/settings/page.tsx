import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";

export default async function HospitalSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("*, hospital:hospitals(*)").eq("id", user.id).single();
  if (profile?.role !== "hospital_admin") redirect("/hospital");

  const hospital = profile.hospital as Record<string, unknown> | null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Hospital Settings</h2>
        <p className="text-sm text-gray-500 mt-0.5">Manage your hospital profile and staff</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Hospital Profile</h3>
        </div>
        <div className="space-y-3 text-sm">
          {hospital && [
            ["Name",    hospital.name],
            ["Code",    hospital.code],
            ["City",    hospital.city],
            ["State",   hospital.state],
            ["Status",  hospital.status],
            ["Tier",    hospital.tier],
          ].map(([label, value]) => (
            <div key={String(label)} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
              <span className="text-gray-500 w-24 shrink-0">{String(label)}</span>
              <span className="text-gray-900 font-medium">{String(value || "—")}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-gray-400">
          To update hospital details, contact your Platform Administrator.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Your Account</h3>
        <div className="space-y-3 text-sm">
          {[
            ["Name",  profile.full_name],
            ["Email", profile.email],
            ["Role",  profile.role],
          ].map(([label, value]) => (
            <div key={String(label)} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
              <span className="text-gray-500 w-24 shrink-0">{String(label)}</span>
              <span className="text-gray-900 font-medium">{String(value || "—")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
