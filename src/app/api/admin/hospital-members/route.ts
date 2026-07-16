import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return profile?.role === "admin" ? supabase : null;
}

// GET — list all hospital_member profiles with their hospital info
export async function GET() {
  try {
    const authed = await verifyAdmin();
    if (!authed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const adminClient = createAdminClient();

    const { data: members, error } = await adminClient
      .from("profiles")
      .select("id, full_name, hospital_id, created_at")
      .eq("role", "hospital_member")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Fetch emails from auth.users for each member
    const { data: authUsers } = await adminClient.auth.admin.listUsers();
    const emailMap = new Map(authUsers?.users?.map((u) => [u.id, u.email]) ?? []);

    return NextResponse.json({
      members: (members ?? []).map((m) => ({
        id: m.id,
        fullName: m.full_name,
        email: emailMap.get(m.id) ?? null,
        hospitalId: m.hospital_id,
        createdAt: m.created_at,
      })),
    });
  } catch (err) {
    console.error("hospital-members GET:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH — assign / reassign hospital for a member
// Accepts optional hospitalData so seeded (in-memory-only) hospitals get saved to Supabase first
export async function PATCH(request: NextRequest) {
  try {
    const authed = await verifyAdmin();
    if (!authed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json() as {
      userId: string;
      hospitalId: string | null;
      hospitalData?: {
        id: string;
        name: string;
        address: string;
        phone: string;
        lat?: number | null;
        lng?: number | null;
        createdAt: number;
      } | null;
    };

    const { userId, hospitalId, hospitalData } = body;
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const adminClient = createAdminClient();

    // Upsert the hospital into Supabase first so the FK constraint passes
    if (hospitalId && hospitalData) {
      const { error: hospErr } = await adminClient.from("hospitals").upsert({
        id: hospitalData.id,
        name: hospitalData.name,
        address: hospitalData.address ?? "",
        phone: hospitalData.phone ?? "",
        lat: hospitalData.lat ?? null,
        lng: hospitalData.lng ?? null,
        created_at: new Date(hospitalData.createdAt).toISOString(),
      }, { onConflict: "id" });

      if (hospErr) {
        console.error("hospital upsert failed:", hospErr.message);
        return NextResponse.json({ error: "Failed to sync hospital: " + hospErr.message }, { status: 500 });
      }
    }

    const { error } = await adminClient
      .from("profiles")
      .update({ hospital_id: hospitalId ?? null })
      .eq("id", userId)
      .eq("role", "hospital_member");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("hospital-members PATCH:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
