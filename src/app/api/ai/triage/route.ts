import { NextResponse } from "next/server";
import { getGroqClient, GROQ_MODEL } from "@/lib/groq";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { clinicalNote?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const note = (body.clinicalNote ?? "").trim();
  if (!note) return NextResponse.json({ error: "clinicalNote is required" }, { status: 400 });

  const prompt = `You are a medical triage AI for an emergency resource allocation system.

Analyze this clinical note and return a JSON object with triage recommendations.

Clinical Note: "${note}"

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "severity": "CRITICAL" | "HIGH" | "MODERATE",
  "resources": array of resources needed from: ["ICU_BED","VENTILATOR","OPERATION_THEATER","AMBULANCE","EMERGENCY_ROOM","MRI_MACHINE","OXYGEN_CONCENTRATOR","BLOOD_BANK","CT_SCANNER","DEFIBRILLATOR"],
  "blood_group": "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "UNKNOWN",
  "reasoning": "one sentence explaining the severity decision"
}

Rules:
- CRITICAL: life-threatening, immediate intervention needed
- HIGH: urgent, deteriorating condition
- MODERATE: stable but needs prompt attention
- Only include resources that are clearly needed based on the clinical note
- If blood group is not mentioned, use "UNKNOWN"`;

  try {
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 300,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "AI returned invalid response" }, { status: 500 });

    const result = JSON.parse(jsonMatch[0]);

    const validSeverities = ["CRITICAL", "HIGH", "MODERATE"];
    const validResources  = ["ICU_BED","VENTILATOR","OPERATION_THEATER","AMBULANCE","EMERGENCY_ROOM","MRI_MACHINE","OXYGEN_CONCENTRATOR","BLOOD_BANK","CT_SCANNER","DEFIBRILLATOR"];
    const validBloods     = ["A+","A-","B+","B-","AB+","AB-","O+","O-","UNKNOWN"];

    return NextResponse.json({
      severity:   validSeverities.includes(result.severity)  ? result.severity  : "HIGH",
      resources:  (result.resources ?? []).filter((r: string) => validResources.includes(r)),
      blood_group: validBloods.includes(result.blood_group)  ? result.blood_group : "UNKNOWN",
      reasoning:  result.reasoning ?? "",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI request failed" },
      { status: 500 }
    );
  }
}
