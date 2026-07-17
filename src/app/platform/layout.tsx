import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PlatformSidebar } from "@/components/platform/PlatformSidebar";
import { PlatformHeader } from "@/components/platform/PlatformHeader";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, hospital:hospitals(*)")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "platform_admin") redirect("/hospital");

  return (
    <div className="flex h-screen bg-[#F5F7FA] overflow-hidden">
      <PlatformSidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <PlatformHeader profile={profile} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
