import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return false;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return ["admin", "super_admin"].includes(profile?.role ?? "");
}

export async function POST(request: NextRequest) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json() as {
      id: string;
      name: string;
      address: string;
      phone: string;
      lat?: number | null;
      lng?: number | null;
      createdAt: number;
    };

    const adminClient = createAdminClient();
    const { error } = await adminClient.from("hospitals").upsert({
      id: body.id,
      name: body.name,
      address: body.address ?? "",
      phone: body.phone ?? "",
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      created_at: new Date(body.createdAt).toISOString(),
    }, { onConflict: "id" });

    if (error) {
      console.error("[hospitals POST] upsert failed:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[hospitals POST] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
