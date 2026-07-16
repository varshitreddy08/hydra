import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    // 1. Verify the caller is an authenticated admin
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Parse and validate body
    const body = await request.json();
    const { email, password, role, fullName, hospitalId, hospitalData } = body as {
      email: string;
      password: string;
      role: "admin" | "viewer" | "hospital_member";
      fullName: string;
      hospitalId?: string;
      hospitalData?: {
        id: string; name: string; address: string; phone: string;
        lat?: number | null; lng?: number | null; createdAt: number;
      } | null;
    };

    if (!email || !password || !role) {
      return NextResponse.json({ error: "email, password and role are required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    if (password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: "Password must be 8–128 characters" }, { status: 400 });
    }

    if (!["admin", "viewer", "hospital_member"].includes(role)) {
      return NextResponse.json({ error: "Role must be admin, viewer, or hospital_member" }, { status: 400 });
    }

    if (role === "hospital_member" && !hospitalId) {
      return NextResponse.json({ error: "hospitalId is required for hospital_member role" }, { status: 400 });
    }

    // 3. Create user via service role (bypasses email confirmation)
    const adminClient = createAdminClient();
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName?.trim() || email, role },
    });

    if (createError) {
      if (createError.message.includes("already registered")) {
        return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
      }
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    // 4. Upsert the hospital first so the FK constraint on profiles.hospital_id passes
    if (role === "hospital_member" && hospitalId && hospitalData) {
      await adminClient.from("hospitals").upsert({
        id: hospitalData.id,
        name: hospitalData.name,
        address: hospitalData.address ?? "",
        phone: hospitalData.phone ?? "",
        lat: hospitalData.lat ?? null,
        lng: hospitalData.lng ?? null,
        created_at: new Date(hospitalData.createdAt).toISOString(),
      }, { onConflict: "id" });
    }

    // 5. Upsert profile with correct role (trigger may have set it to viewer)
    if (newUser.user) {
      await adminClient
        .from("profiles")
        .upsert({
          id: newUser.user.id,
          role,
          full_name: fullName?.trim() || email,
          hospital_id: role === "hospital_member" ? (hospitalId ?? null) : null,
        });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.user?.id,
        email: newUser.user?.email,
        role,
      },
    });
  } catch (err) {
    console.error("Create user error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
