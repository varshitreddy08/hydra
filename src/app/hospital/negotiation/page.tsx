import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NegotiationClient } from "@/components/hospital/NegotiationClient";

export default async function NegotiationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("hospital_id, role").eq("id", user.id).single();
  if (!profile?.hospital_id) redirect("/hospital");

  // Get all active hospitals for network map
  const { data: hospitals } = await supabase
    .from("hospitals").select("id, name, code, city, lat, lng, status").eq("status","active");

  // Get pending emergency requests for this hospital
  const { data: requests } = await supabase
    .from("emergency_requests")
    .select("*")
    .eq("hospital_id", profile.hospital_id)
    .in("status", ["PENDING","NEGOTIATING"])
    .order("created_at");

  // Get recent negotiations
  const { data: negotiations } = await supabase
    .from("negotiations")
    .select("*, request:emergency_requests(*), winning_hospital:hospitals(name,city)")
    .eq("requesting_hospital_id", profile.hospital_id)
    .order("started_at", { ascending: false })
    .limit(10);

  // Get all resources for network view
  const { data: allResources } = await supabase
    .from("resources")
    .select("hospital_id, type, status")
    .eq("status", "AVAILABLE");

  return (
    <NegotiationClient
      hospitalId={profile.hospital_id}
      hospitals={hospitals || []}
      pendingRequests={requests || []}
      negotiations={negotiations || []}
      allResources={allResources || []}
      canApprove={["hospital_admin","emergency_doctor"].includes(profile.role)}
    />
  );
}
