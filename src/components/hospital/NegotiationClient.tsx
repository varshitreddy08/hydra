"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Activity, CheckCircle2, XCircle, Play, TrendingUp,
  Building2, Clock, AlertTriangle, Cpu, ChevronDown, ChevronUp,
} from "lucide-react";
import type { EmergencyRequest, Negotiation } from "@/types";

/* ─── AI Scoring Engine ─────────────────────────────────────────────────── */

interface HospitalBid {
  hospital_id: string;
  hospital_name: string;
  city: string;
  resources: Record<string, number>;
  score: number;
  breakdown: {
    availability: number;
    distance: number;
    doctor_availability: number;
    ambulance_eta: number;
    hospital_load: number;
  };
  reasoning: string;
}

function computeBid(
  hospital: { id: string; name: string; city: string; lat?: number; lng?: number },
  request: EmergencyRequest,
  resources: { hospital_id: string; type: string; status: string }[],
  requestingHospital: { lat?: number; lng?: number } | null,
): HospitalBid {
  const hospResources = resources.filter(r => r.hospital_id === hospital.id && r.status === "AVAILABLE");

  // Availability score — how many needed resource types are available
  const neededTypes = request.needed_resources as string[];
  const covered = neededTypes.filter(type =>
    hospResources.some(r => r.type === type)
  ).length;
  const availability = neededTypes.length > 0 ? (covered / neededTypes.length) * 100 : 0;

  // Distance score (simplified — use lat/lng if available)
  let distanceScore = 60;
  if (hospital.lat && hospital.lng && requestingHospital?.lat && requestingHospital?.lng) {
    const d = Math.sqrt(
      Math.pow((hospital.lat - requestingHospital.lat) * 111, 2) +
      Math.pow((hospital.lng - requestingHospital.lng) * 111, 2)
    );
    distanceScore = Math.max(0, 100 - d * 8);
  }

  // Doctor availability
  const doctorAvail = hospResources.filter(r => r.type === "DOCTOR" || r.type === "SPECIALIST").length;
  const doctorScore = Math.min(doctorAvail * 25, 100);

  // Ambulance ETA
  const ambAvail    = hospResources.filter(r => r.type === "AMBULANCE").length;
  const ambulanceScore = ambAvail > 0 ? Math.min(100, 50 + ambAvail * 20) : 30;

  // Hospital load (inverse of occupied resources)
  const totalHospRes  = resources.filter(r => r.hospital_id === hospital.id).length;
  const occupiedCount = resources.filter(r => r.hospital_id === hospital.id && r.status === "OCCUPIED").length;
  const loadScore     = totalHospRes > 0 ? Math.round((1 - occupiedCount / totalHospRes) * 100) : 80;

  // Urgency multiplier
  const urgency = request.severity === "CRITICAL" ? 1.5
                : request.severity === "HIGH"     ? 1.2
                : 1.0;

  // Weighted final score
  const raw =
    availability   * 0.40 +
    distanceScore  * 0.25 +
    doctorScore    * 0.15 +
    ambulanceScore * 0.10 +
    loadScore      * 0.10;

  const score = Math.min(99, Math.round(raw * urgency));

  const resourceMap: Record<string, number> = {};
  neededTypes.forEach(type => {
    resourceMap[type] = hospResources.filter(r => r.type === type).length;
  });

  const reasons: string[] = [];
  if (availability >= 80)     reasons.push("✓ Resources available");
  if (distanceScore >= 70)    reasons.push("✓ Nearby location");
  if (doctorScore >= 50)      reasons.push("✓ Doctor available");
  if (ambulanceScore >= 70)   reasons.push("✓ Ambulance ready");
  if (availability < 50)      reasons.push("✗ Limited resources");

  return {
    hospital_id:   hospital.id,
    hospital_name: hospital.name,
    city:          hospital.city,
    resources:     resourceMap,
    score,
    breakdown: {
      availability:       Math.round(availability),
      distance:           Math.round(distanceScore),
      doctor_availability: Math.round(doctorScore),
      ambulance_eta:      Math.round(ambulanceScore),
      hospital_load:      Math.round(loadScore),
    },
    reasoning: reasons.join(" · "),
  };
}

/* ─── Component ─────────────────────────────────────────────────────────── */

interface Props {
  hospitalId: string;
  hospitals: { id: string; name: string; code: string; city: string; lat?: number; lng?: number; status: string }[];
  pendingRequests: EmergencyRequest[];
  negotiations: Negotiation[];
  allResources: { hospital_id: string; type: string; status: string }[];
  canApprove: boolean;
}

export function NegotiationClient({
  hospitalId, hospitals, pendingRequests, negotiations, allResources, canApprove,
}: Props) {
  const router = useRouter();
  const [selectedRequest, setSelectedRequest] = useState<EmergencyRequest | null>(null);
  const [bids,            setBids]            = useState<HospitalBid[]>([]);
  const [negotiating,     setNegotiating]     = useState(false);
  const [negotiationDone, setNegotiationDone] = useState(false);
  const [winner,          setWinner]          = useState<HospitalBid | null>(null);
  const [expandedBid,     setExpandedBid]     = useState<string | null>(null);
  const [approving,       setApproving]       = useState(false);
  const [phase,           setPhase]           = useState<string>("IDLE");
  const [phaseStep,       setPhaseStep]       = useState(0);

  const otherHospitals = hospitals.filter(h => h.id !== hospitalId);

  const runNegotiation = useCallback(async () => {
    if (!selectedRequest) return;
    setNegotiating(true);
    setNegotiationDone(false);
    setWinner(null);
    setBids([]);
    setPhaseStep(0);

    const myHospital = hospitals.find(h => h.id === hospitalId) || null;

    const phases = ["ANNOUNCEMENT", "BIDDING", "EVALUATION", "AWARD"];
    for (let i = 0; i < phases.length; i++) {
      setPhase(phases[i]);
      setPhaseStep(i + 1);
      await new Promise(r => setTimeout(r, 800));
    }

    // Compute bids from all other hospitals
    const computedBids = otherHospitals
      .map(h => computeBid(h, selectedRequest, allResources, myHospital))
      .filter(b => Object.values(b.resources).some(v => v > 0))
      .sort((a, b) => b.score - a.score);

    setBids(computedBids);

    await new Promise(r => setTimeout(r, 400));
    setPhase("COMPLETED");

    const best = computedBids[0] || null;
    setWinner(best);
    setNegotiating(false);
    setNegotiationDone(true);

    // Persist negotiation to DB
    try {
      const supabase = createClient();
      const { data: neg } = await supabase.from("negotiations").insert({
        request_id:             selectedRequest.id,
        requesting_hospital_id: hospitalId,
        status:                 best ? "COMPLETED" : "FAILED",
        winning_hospital_id:    best?.hospital_id || null,
        overall_score:          best?.score || null,
        summary:                best
          ? `AI allocated to ${best.hospital_name} with score ${best.score}%. ${best.reasoning}`
          : "No suitable hospital found in the network",
      }).select().single();

      if (neg && best) {
        // Insert all bids
        await supabase.from("negotiation_bids").insert(
          computedBids.map(b => ({
            negotiation_id:      neg.id,
            bidding_hospital_id: b.hospital_id,
            resource_type:       selectedRequest.needed_resources[0] || "ICU_BED",
            available_count:     Object.values(b.resources).reduce((s, v) => s + v, 0),
            score:               b.score,
            score_breakdown:     b.breakdown,
            status:              b.hospital_id === best.hospital_id ? "ACCEPTED" : "REJECTED",
          }))
        );

        // Update request status
        await supabase.from("emergency_requests").update({ status: "NEGOTIATING" }).eq("id", selectedRequest.id);
      }
    } catch { /* non-blocking */ }
  }, [selectedRequest, hospitalId, hospitals, otherHospitals, allResources]);

  async function approveTransfer() {
    if (!selectedRequest || !winner) return;
    setApproving(true);
    try {
      const supabase = createClient();
      await supabase.from("emergency_requests")
        .update({ status: "ALLOCATED", updated_at: new Date().toISOString() })
        .eq("id", selectedRequest.id);

      // Update resources at winning hospital as occupied
      await supabase.from("resources")
        .update({ status: "OCCUPIED", current_request_id: selectedRequest.id })
        .eq("hospital_id", winner.hospital_id)
        .in("type", selectedRequest.needed_resources as string[])
        .eq("status", "AVAILABLE");

      router.refresh();
      setSelectedRequest(null);
      setBids([]);
      setNegotiationDone(false);
      setWinner(null);
      setPhase("IDLE");
    } finally {
      setApproving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">AI Negotiation Engine</h2>
        <p className="text-sm text-gray-500 mt-0.5">Multi-agent resource allocation with explainable decisions</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left: Request selector */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-semibold text-gray-900">Pending Requests</h3>
            </div>
            {pendingRequests.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">
                No pending emergency requests
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {pendingRequests.map(r => (
                  <button
                    key={r.id}
                    onClick={() => { setSelectedRequest(r); setNegotiationDone(false); setBids([]); setWinner(null); setPhase("IDLE"); }}
                    className={`w-full text-left px-5 py-3.5 hover:bg-gray-50 transition-colors ${selectedRequest?.id === r.id ? "bg-blue-50" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-mono font-semibold text-gray-900">{r.patient_token}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        r.severity === "CRITICAL" ? "bg-red-50 text-red-700" :
                        r.severity === "HIGH"     ? "bg-amber-50 text-amber-700" :
                        "bg-blue-50 text-blue-700"
                      }`}>
                        {r.severity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{r.needed_resources.join(", ")}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Network hospitals */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-gray-900">Hospital Network ({otherHospitals.length})</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {otherHospitals.map(h => {
                const avail = allResources.filter(r => r.hospital_id === h.id && r.status === "AVAILABLE").length;
                return (
                  <div key={h.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-800">{h.name}</p>
                      <p className="text-xs text-gray-400">{h.city}</p>
                    </div>
                    <span className="text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                      {avail} free
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center: Negotiation engine */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedRequest ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
              <Cpu className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-400">Select an emergency request to start AI negotiation</p>
            </div>
          ) : (
            <>
              {/* Selected request card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Emergency Request</p>
                    <p className="text-xl font-bold font-mono text-gray-900">{selectedRequest.patient_token}</p>
                    {selectedRequest.clinical_note && (
                      <p className="text-sm text-gray-500 mt-1">{selectedRequest.clinical_note}</p>
                    )}
                  </div>
                  <span className={`text-sm font-bold px-3 py-1.5 rounded-xl border ${
                    selectedRequest.severity === "CRITICAL" ? "bg-red-50 text-red-700 border-red-200" :
                    selectedRequest.severity === "HIGH"     ? "bg-amber-50 text-amber-700 border-amber-200" :
                    "bg-blue-50 text-blue-700 border-blue-200"
                  }`}>
                    {selectedRequest.severity}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedRequest.needed_resources.map(res => (
                    <span key={res} className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-lg font-medium border border-gray-200">
                      {res.replace(/_/g, " ")}
                    </span>
                  ))}
                  {selectedRequest.blood_group && selectedRequest.blood_group !== "UNKNOWN" && (
                    <span className="text-xs bg-red-50 text-red-700 px-3 py-1 rounded-lg font-medium border border-red-200">
                      Blood: {selectedRequest.blood_group}
                    </span>
                  )}
                  {selectedRequest.eta_minutes && (
                    <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-medium border border-blue-200">
                      <Clock className="w-3 h-3" />ETA {selectedRequest.eta_minutes} min
                    </span>
                  )}
                </div>

                {/* Phase progress */}
                {(negotiating || negotiationDone) && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      {["ANNOUNCEMENT","BIDDING","EVALUATION","AWARD"].map((p, i) => (
                        <div key={p} className="flex-1 flex flex-col items-center gap-1">
                          <div className={`w-full h-1.5 rounded-full transition-all duration-500 ${
                            phaseStep > i ? "bg-[#1976D2]" :
                            phaseStep === i + 1 ? "bg-blue-300 animate-pulse" :
                            "bg-gray-200"
                          }`} />
                          <span className="text-xs text-gray-400">{p}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-center font-medium text-[#1976D2]">
                      {negotiating ? `Phase: ${phase}` : "Negotiation Complete"}
                    </p>
                  </div>
                )}

                {!negotiating && !negotiationDone && canApprove && (
                  <button
                    onClick={runNegotiation}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Start AI Negotiation
                  </button>
                )}
                {negotiating && (
                  <div className="flex items-center justify-center gap-2 py-3 bg-purple-50 border border-purple-200 rounded-xl">
                    <Activity className="w-4 h-4 text-purple-600 animate-pulse" />
                    <span className="text-sm font-medium text-purple-700">AI agents negotiating…</span>
                  </div>
                )}
              </div>

              {/* Bids */}
              {bids.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    <h3 className="text-sm font-semibold text-gray-900">Hospital Bids — AI Scoring</h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {bids.map((bid, idx) => (
                      <div key={bid.hospital_id} className={`px-5 py-4 ${idx === 0 && negotiationDone ? "bg-green-50" : ""}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            {idx === 0 && negotiationDone && (
                              <span className="text-xs font-bold text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-full">
                                🏆 WINNER
                              </span>
                            )}
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{bid.hospital_name}</p>
                              <p className="text-xs text-gray-400">{bid.city}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className={`text-2xl font-bold ${bid.score >= 80 ? "text-green-600" : bid.score >= 60 ? "text-amber-600" : "text-red-500"}`}>
                                {bid.score}
                              </p>
                              <p className="text-xs text-gray-400">score</p>
                            </div>
                            <button
                              onClick={() => setExpandedBid(expandedBid === bid.hospital_id ? null : bid.hospital_id)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100"
                            >
                              {expandedBid === bid.hospital_id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Score bar */}
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                          <div
                            className="h-full rounded-full score-bar-fill"
                            style={{
                              width: `${bid.score}%`,
                              background: bid.score >= 80 ? "#22C55E" : bid.score >= 60 ? "#F59E0B" : "#EF4444",
                            }}
                          />
                        </div>

                        {/* Resource availability */}
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {Object.entries(bid.resources).map(([type, count]) => (
                            <span key={type} className={`text-xs px-2 py-0.5 rounded-md font-medium border ${
                              count > 0
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }`}>
                              {type.replace(/_/g, " ")}: {count > 0 ? `${count} ✓` : "✗"}
                            </span>
                          ))}
                        </div>

                        {/* Expanded breakdown */}
                        {expandedBid === bid.hospital_id && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Score Breakdown</p>
                            {[
                              { key: "availability",        label: "Resource Availability", weight: "40%" },
                              { key: "distance",            label: "Distance",               weight: "25%" },
                              { key: "doctor_availability", label: "Doctor Availability",    weight: "15%" },
                              { key: "ambulance_eta",       label: "Ambulance ETA",          weight: "10%" },
                              { key: "hospital_load",       label: "Hospital Load",          weight: "10%" },
                            ].map(({ key, label, weight }) => {
                              const v = bid.breakdown[key as keyof typeof bid.breakdown];
                              return (
                                <div key={key} className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500 w-36 shrink-0">{label}</span>
                                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#1976D2] rounded-full" style={{ width: `${v}%` }} />
                                  </div>
                                  <span className="text-xs font-bold text-gray-700 w-8 text-right">{v}</span>
                                  <span className="text-xs text-gray-400 w-8">{weight}</span>
                                </div>
                              );
                            })}
                            {bid.reasoning && (
                              <p className="text-xs text-gray-500 pt-1 border-t border-gray-200">{bid.reasoning}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Winner + approve */}
              {negotiationDone && winner && canApprove && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-green-100 border border-green-200 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-green-800">AI Recommendation</p>
                      <p className="text-xl font-bold text-green-700">{winner.hospital_name}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-3xl font-bold text-green-600">{winner.score}%</p>
                      <p className="text-xs text-green-500">confidence</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={approveTransfer}
                      disabled={approving}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {approving ? "Approving…" : "Approve Transfer"}
                    </button>
                    <button
                      onClick={() => { setNegotiationDone(false); setBids([]); setWinner(null); setPhase("IDLE"); }}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-xl transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {negotiationDone && bids.length === 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
                  <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-red-700">No suitable hospital found</p>
                  <p className="text-xs text-red-500 mt-1">All hospitals in the network lack the required resources</p>
                </div>
              )}
            </>
          )}

          {/* Negotiation history */}
          {negotiations.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Recent Negotiations</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {(negotiations as unknown as Record<string, unknown>[]).slice(0, 5).map((n) => {
                  const req = n.request as Record<string, unknown> | null;
                  const wh  = n.winning_hospital as Record<string, unknown> | null;
                  return (
                    <div key={String(n.id)} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-mono text-gray-900">{req ? String(req.patient_token) : "—"}</p>
                        <p className="text-xs text-gray-400">{wh ? `→ ${String(wh.name)}` : "No winner"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {Boolean(n.overall_score) && (
                          <span className="text-xs font-bold text-gray-700">{String(n.overall_score)}%</span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          n.status === "COMPLETED" ? "bg-green-50 text-green-700" :
                          n.status === "FAILED"    ? "bg-red-50 text-red-700" :
                          "bg-blue-50 text-blue-700"
                        }`}>
                          {String(n.status)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
