import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AnalyticsClient } from "@/components/hospital/AnalyticsClient";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("hospital_id, role").eq("id", user.id).single();
  if (!profile?.hospital_id || profile.role !== "hospital_admin") redirect("/hospital");

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const [reqRes, negRes, resRes] = await Promise.all([
    supabase.from("emergency_requests").select("severity, status, created_at")
      .eq("hospital_id", profile.hospital_id).gte("created_at", sevenDaysAgo),
    supabase.from("negotiations").select("status, overall_score, started_at")
      .eq("requesting_hospital_id", profile.hospital_id).gte("started_at", sevenDaysAgo),
    supabase.from("resources").select("type, status").eq("hospital_id", profile.hospital_id),
  ]);

  return (
    <AnalyticsClient
      requests={reqRes.data || []}
      negotiations={negRes.data || []}
      resources={resRes.data || []}
    />
  );
}
