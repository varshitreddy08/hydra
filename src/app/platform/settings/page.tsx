import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "@/components/platform/SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: configs } = await supabase.from("system_config").select("*");

  const weights   = configs?.find(c => c.key === "ai_scoring_weights")?.value || {};
  const emergency = configs?.find(c => c.key === "emergency_config")?.value    || {};

  return <SettingsClient weights={weights} emergency={emergency} />;
}
