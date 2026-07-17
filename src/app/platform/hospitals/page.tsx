import { createClient } from "@/lib/supabase/server";
import { HospitalsClient } from "@/components/platform/HospitalsClient";

export default async function HospitalsPage() {
  const supabase = await createClient();
  const { data: hospitals } = await supabase
    .from("hospitals")
    .select("*")
    .order("created_at", { ascending: false });

  return <HospitalsClient hospitals={hospitals || []} />;
}
