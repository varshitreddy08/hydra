import { createClient } from "@/lib/supabase/server";
import { PlatformAnalyticsClient } from "@/components/platform/PlatformAnalyticsClient";

export default async function PlatformAnalyticsPage() {
  const supabase = await createClient();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const [hospitalsRes, requestsRes, negotiationsRes] = await Promise.all([
    supabase.from("hospitals").select("status, tier, created_at").gte("created_at", thirtyDaysAgo),
    supabase.from("emergency_requests").select("severity, status, created_at").gte("created_at", thirtyDaysAgo),
    supabase.from("negotiations").select("status, overall_score, started_at").gte("started_at", thirtyDaysAgo),
  ]);

  return (
    <PlatformAnalyticsClient
      hospitals={hospitalsRes.data || []}
      requests={requestsRes.data || []}
      negotiations={negotiationsRes.data || []}
    />
  );
}
