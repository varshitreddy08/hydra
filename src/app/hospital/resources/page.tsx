import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ResourcesClient } from "@/components/hospital/ResourcesClient";

export default async function ResourcesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("hospital_id, role").eq("id", user.id).single();
  if (!profile?.hospital_id) redirect("/hospital");

  const { data: resources } = await supabase
    .from("resources")
    .select("*")
    .eq("hospital_id", profile.hospital_id)
    .order("type");

  return (
    <ResourcesClient
      resources={resources || []}
      hospitalId={profile.hospital_id}
      canEdit={["hospital_admin","resource_manager"].includes(profile.role)}
    />
  );
}
