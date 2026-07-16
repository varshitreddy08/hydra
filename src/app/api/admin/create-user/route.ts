import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// One-time route: POST /api/admin/create-user
// Body: { email, password, secret }
// Protected by ADMIN_SETUP_SECRET env var so it can't be abused

export async function POST(request: Request) {
  const secret = process.env.ADMIN_SETUP_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "ADMIN_SETUP_SECRET not configured" }, { status: 503 });
  }

  let body: { email?: string; password?: string; secret?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.secret !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: "email and password (min 8 chars) required" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, userId: data.user.id, email: data.user.email });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
