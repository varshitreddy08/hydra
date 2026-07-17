import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// One-time setup route: POST /api/admin/create-user
// Body: { email, password, role, hospitalId, secret }
// Protected by ADMIN_SETUP_SECRET env var

export async function POST(request: Request) {
  const secret = process.env.ADMIN_SETUP_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "ADMIN_SETUP_SECRET not configured" }, { status: 503 });
  }

  let body: { email?: string; password?: string; role?: string; hospitalId?: string; secret?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.secret !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const email    = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const role     = body.role ?? "platform_admin";

  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: "email and password (min 8 chars) required" }, { status: 400 });
  }

  const validRoles = ["platform_admin","hospital_admin","resource_manager","emergency_doctor"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: `role must be one of: ${validRoles.join(", ")}` }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Upsert profile with the correct role
    if (data.user) {
      await admin.from("profiles").upsert({
        id:          data.user.id,
        email,
        role,
        hospital_id: body.hospitalId || null,
      });
    }

    return NextResponse.json({
      ok: true,
      userId: data.user.id,
      email:  data.user.email,
      role,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
