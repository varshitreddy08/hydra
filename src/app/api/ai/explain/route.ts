import { NextResponse } from "next/server";
import { getGroqClient, GROQ_MODEL } from "@/lib/groq";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    winningHospital?: string;
    score?: number;
    severity?: string;
    resources?: string[];
    breakdown?: Record<string, number>;
    totalBids?: number;
  };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { winningHospital, score, severity, resources, breakdown, totalBids } = body;

  const prompt = `You are an explainable AI system for hospital emergency resource allocation.

A multi-agent negotiation just completed. Write a clear, concise 2-3 sentence explanation of why this hospital was selected.

Winning Hospital: ${winningHospital}
Overall Score: ${score}%
Patient Severity: ${severity}
Resources Needed: ${(resources ?? []).join(", ")}
Total Hospitals that Bid: ${totalBids}
Score Breakdown:
- Resource Availability: ${breakdown?.availability ?? 0}%
- Distance/Proximity: ${breakdown?.distance ?? 0}%
- Equipment Match: ${breakdown?.equipment ?? 0}%
- Ambulance Availability: ${breakdown?.ambulance ?? 0}%
- Current Load: ${breakdown?.load ?? 0}%

Write ONLY the explanation paragraph, no headings, no bullet points. Make it sound professional and medical. Mention the top 2-3 factors that led to this decision.`;

  try {
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 200,
    });

    const explanation = completion.choices[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ explanation });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI request failed" },
      { status: 500 }
    );
  }
}
