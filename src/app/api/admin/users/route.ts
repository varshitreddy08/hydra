import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_ROLES = ["platform_admin","hospital_admin","resource_manager","emergency_doctor"] as const;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single();

    const callerRole = profile?.role ?? "";

    // Only platform_admin and hospital_admin can create users
    if (!["platform_admin","hospital_admin"].includes(callerRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, role, fullName, hospitalId } = body as {
      email: string;
      password: string;
      role: typeof VALID_ROLES[number];
      fullName?: string;
      hospitalId?: string;
    };

    if (!email || !password || !role) {
      return NextResponse.json({ error: "email, password and role are required" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    if (password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: "Password must be 8–128 characters" }, { status: 400 });
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: `Role must be one of: ${VALID_ROLES.join(", ")}` }, { status: 400 });
    }

    // Only platform_admin can create other platform_admins
    if (role === "platform_admin" && callerRole !== "platform_admin") {
      return NextResponse.json({ error: "Only platform admins can create platform admin accounts" }, { status: 403 });
    }

    // Hospital admin can only create users for their hospital
    if (callerRole === "hospital_admin") {
      const { data: adminProfile } = await supabase
        .from("profiles").select("hospital_id").eq("id", user.id).single();
      if (!hospitalId || hospitalId !== adminProfile?.hospital_id) {
        return NextResponse.json({ error: "Hospital admins can only create users for their own hospital" }, { status: 403 });
      }
    }

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

    if (newUser.user) {
      await adminClient.from("profiles").upsert({
        id:          newUser.user.id,
        email:       email.trim().toLowerCase(),
        role,
        full_name:   fullName?.trim() || email,
        hospital_id: hospitalId || null,
      });
    }

    return NextResponse.json({
      success: true,
      user: { id: newUser.user?.id, email: newUser.user?.email, role },
    });
  } catch (err) {
    console.error("Create user error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
