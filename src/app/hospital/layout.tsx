import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { HospitalSidebar } from "@/components/hospital/HospitalSidebar";
import { HospitalHeader } from "@/components/hospital/HospitalHeader";

export default async function HospitalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, hospital:hospitals(*)")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");
  if (profile.role === "platform_admin") redirect("/platform");

  return (
    <div className="flex h-screen bg-[#F5F7FA] overflow-hidden">
      <HospitalSidebar role={profile.role} />
      <div className="flex flex-col flex-1 min-w-0">
        <HospitalHeader profile={profile} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
