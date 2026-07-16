import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { HospitalPortalShell } from "@/components/hospital-portal/HospitalPortalShell";

export default async function HospitalPortalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, hospital_id, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "hospital_member") {
    redirect("/dashboard");
  }

  if (!profile.hospital_id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Account Setup Pending</h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              Your hospital staff account is ready but hasn&apos;t been linked to a hospital yet.
              Please contact your system administrator to complete the setup.
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
            Reference your email address when contacting support so they can assign you to the correct hospital.
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-sm text-slate-400 hover:text-slate-600 underline transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    );
  }

  const { data: hospital } = await supabase
    .from("hospitals")
    .select("id, name, address, phone")
    .eq("id", profile.hospital_id)
    .single();

  return (
    <HospitalPortalShell
      hospitalId={profile.hospital_id}
      hospitalName={hospital?.name ?? "Unknown Hospital"}
      hospitalAddress={hospital?.address ?? ""}
      staffName={profile.full_name ?? user.email ?? "Staff"}
    />
  );
}
