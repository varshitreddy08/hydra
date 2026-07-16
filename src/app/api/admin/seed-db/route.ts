import { NextResponse } from "next/server";

// No seed data — hospitals and resources come exclusively from the database.
export async function POST() {
  return NextResponse.json({ ok: true });
}
