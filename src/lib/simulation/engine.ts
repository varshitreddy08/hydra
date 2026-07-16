import type {
  Patient,
  Resource,
  ResourceAgent,
  NegotiationRound,
  Bid,
  BidBreakdown,
  AllocationDecision,
  AuditLogEntry,
  ReasoningFactor,
  TriageScore,
  Vitals,
  ClinicalCondition,
  TriageLevel,
  NegotiationPhase,
} from "@/types";

// ─── Triage Scoring ──────────────────────────────────────────────────────────

const CONDITION_WEIGHTS: Record<ClinicalCondition, number> = {
  CARDIAC_ARREST: 100,
  STROKE_HEMORRHAGIC: 90,
  RESPIRATORY_FAILURE: 85,
  TRAUMA_MAJOR: 80,
  POLYTRAUMA: 78,
  STROKE_ISCHEMIC: 75,
  SEPSIS: 70,
  BURNS_MAJOR: 65,
  ANAPHYLAXIS: 60,
  OVERDOSE: 50,
};

const URGENCY_MULTIPLIER: Record<TriageLevel, number> = {
  P1_IMMEDIATE: 2.0,
  P2_EMERGENT: 1.5,
  P3_URGENT: 1.0,
  P4_LESS_URGENT: 0.7,
  P5_NON_URGENT: 0.4,
};

function computeMEWS(vitals: Vitals): number {
  let score = 0;
  const { heartRate, systolicBP, respiratoryRate, consciousnessScore, oxygenSaturation } = vitals;

  if (heartRate < 40 || heartRate > 130) score += 3;
  else if (heartRate < 50 || heartRate > 110) score += 2;
  else if (heartRate < 60 || heartRate > 100) score += 1;

  if (systolicBP < 70) score += 3;
  else if (systolicBP < 80) score += 2;
  else if (systolicBP < 100 || systolicBP > 199) score += 1;

  if (respiratoryRate < 9 || respiratoryRate > 29) score += 2;
  else if (respiratoryRate > 20) score += 1;

  if (consciousnessScore < 9) score += 3;
  else if (consciousnessScore < 13) score += 2;
  else if (consciousnessScore < 15) score += 1;

  if (oxygenSaturation < 85) score += 3;
  else if (oxygenSaturation < 90) score += 2;
  else if (oxygenSaturation < 95) score += 1;

  return Math.min(score, 14);
}

export function computeTriageScore(
  condition: ClinicalCondition,
  vitals: Vitals,
  arrivedAt: number
): TriageScore {
  const mewsScore = computeMEWS(vitals);
  const conditionWeight = CONDITION_WEIGHTS[condition];
  const waitTimeMs = Date.now() - arrivedAt;
  const waitMinutes = waitTimeMs / 60000;
  const timeFactorPenalty = Math.min(
    30,
    waitMinutes * (conditionWeight > 80 ? 3 : 1)
  );

  const vitalScore = (mewsScore / 14) * 100;
  const raw = Math.min(
    100,
    vitalScore * 0.3 + conditionWeight * 0.5 + timeFactorPenalty * 0.2
  );

  const esiScore =
    raw >= 90 ? 1 : raw >= 75 ? 2 : raw >= 55 ? 3 : raw >= 35 ? 4 : 5;

  const triageLevel: TriageLevel =
    esiScore === 1
      ? "P1_IMMEDIATE"
      : esiScore === 2
      ? "P2_EMERGENT"
      : esiScore === 3
      ? "P3_URGENT"
      : esiScore === 4
      ? "P4_LESS_URGENT"
      : "P5_NON_URGENT";

  return {
    raw,
    triageLevel,
    mewsScore,
    esiScore,
    timeFactorPenalty,
    conditionWeight,
    breakdown: {
      vitalScore,
      conditionScore: conditionWeight,
      waitTimeScore: timeFactorPenalty,
    },
    computedAt: Date.now(),
  };
}

// ─── Bid Scoring ─────────────────────────────────────────────────────────────

function getProximityScore(resourceLocation: string, patientLocation: string): number {
  if (resourceLocation === patientLocation) return 100;
  if (resourceLocation.split(",")[0] === patientLocation.split(",")[0]) return 70;
  return 40;
}

export function computeBidScore(
  resource: Resource,
  patient: Patient
): BidBreakdown {
  const availabilityScore = resource.status === "AVAILABLE" ? 100 : 0;

  const requiredCaps = new Set(patient.requiredCapabilities);
  const resourceCaps = new Set(resource.capabilities);
  const matchCount = [...requiredCaps].filter((c) => resourceCaps.has(c)).length;
  const capabilityScore =
    requiredCaps.size > 0 ? (matchCount / requiredCaps.size) * 100 : 100;

  const proximityScore = getProximityScore(resource.location, "Emergency");

  const recentUtil =
    resource.utilizationHistory.length > 0
      ? resource.utilizationHistory
          .slice(-20)
          .reduce((a, b) => a + b, 0) / Math.min(20, resource.utilizationHistory.length)
      : 0;
  const utilizationPenalty = -(recentUtil * 30);

  const conditionKey = patient.condition.toLowerCase().replace(/_/g, "_");
  const specialtyBonus = resource.capabilities.some(
    (c) => c.toLowerCase().includes(conditionKey.split("_")[0])
  )
    ? 20
    : 0;

  const urgencyMultiplier =
    URGENCY_MULTIPLIER[patient.triageScore.triageLevel] ?? 1.0;

  const rawScore =
    availabilityScore * 0.35 +
    capabilityScore * 0.30 +
    proximityScore * 0.10 +
    specialtyBonus * 0.15 +
    (100 + utilizationPenalty) * 0.10;

  const finalScore = Math.min(100, rawScore * urgencyMultiplier);

  return {
    availabilityScore,
    capabilityScore,
    proximityScore,
    utilizationPenalty,
    specialtyBonus,
    urgencyMultiplier,
    finalScore,
  };
}

// ─── Explainability ──────────────────────────────────────────────────────────

export function buildReasoningFactors(
  winningBids: Bid[],
  rejectedBids: Bid[],
  patient: Patient,
  resources: Resource[]
): ReasoningFactor[] {
  const factors: ReasoningFactor[] = [];

  factors.push({
    factor: "Patient Triage Score",
    value: patient.triageScore.raw.toFixed(1),
    weight: 0.35,
    direction:
      patient.triageScore.raw > 70
        ? "POSITIVE"
        : patient.triageScore.raw > 40
        ? "NEUTRAL"
        : "NEGATIVE",
    explanation: `Patient scored ${patient.triageScore.raw.toFixed(1)}/100 (${patient.triageScore.triageLevel}). MEWS=${patient.triageScore.mewsScore}. ${
      patient.triageScore.triageLevel === "P1_IMMEDIATE"
        ? "2x urgency multiplier applied to all bids."
        : ""
    }`,
  });

  if (winningBids[0] && rejectedBids.length > 0) {
    const topRejected = rejectedBids.sort((a, b) => b.score - a.score)[0];
    const gap = winningBids[0].score - topRejected.score;
    const winner = resources.find((r) => r.id === winningBids[0].agentId);
    const runnerUp = resources.find((r) => r.id === topRejected.agentId);
    factors.push({
      factor: "Bid Score Differential",
      value: `${gap.toFixed(1)} points`,
      weight: 0.30,
      direction: "POSITIVE",
      explanation: `${winner?.name ?? "Winner"} outscored ${runnerUp?.name ?? "runner-up"} by ${gap.toFixed(1)} points. Key differentiator: ${
        winningBids[0].breakdown.specialtyBonus > 0
          ? "exact specialty match (+20 bonus)"
          : "higher capability coverage"
      }.`,
    });
  }

  factors.push({
    factor: "Resource Availability",
    value: `${winningBids.length} allocated`,
    weight: 0.25,
    direction:
      winningBids.length >= patient.requiresResourceTypes.length
        ? "POSITIVE"
        : "NEGATIVE",
    explanation: `${winningBids.length} of ${patient.requiresResourceTypes.length} required resource types allocated. ${
      winningBids.length < patient.requiresResourceTypes.length
        ? "Some dependencies were unavailable."
        : "All resource dependencies satisfied."
    }`,
  });

  const waitMin = Math.floor((Date.now() - patient.arrivedAt) / 60000);
  factors.push({
    factor: "Wait Time Urgency",
    value: `${waitMin} min`,
    weight: 0.10,
    direction: waitMin > 30 ? "NEGATIVE" : "NEUTRAL",
    explanation: `Patient waited ${waitMin} minutes. Time-factor penalty of +${patient.triageScore.timeFactorPenalty.toFixed(1)} applied to triage score.`,
  });

  return factors;
}

export function buildNaturalLanguageSummary(
  patient: Patient,
  winningResources: Resource[],
  decisionTimeMs: number,
  outcome: string
): string {
  const names = winningResources.map((r) => r.name).join(", ");
  const waitMin = Math.floor((Date.now() - patient.arrivedAt) / 60000);
  if (outcome === "FAILED") {
    return `No resources available for ${patient.condition.replace(/_/g, " ")} patient (${patient.triageScore.triageLevel}) after ${decisionTimeMs}ms negotiation. Patient re-queued.`;
  }
  return (
    `${patient.condition.replace(/_/g, " ")} patient (${patient.triageScore.triageLevel}) ` +
    `allocated to: ${names || "no resources"} after ${decisionTimeMs}ms negotiation. ` +
    `Waited ${waitMin} min. Decision driven by triage urgency and capability matching.`
  );
}

// ─── Audit Hash ──────────────────────────────────────────────────────────────

export async function computeAuditHash(payload: object): Promise<string> {
  const data = new TextEncoder().encode(JSON.stringify(payload));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── Contract Net Protocol ───────────────────────────────────────────────────

export interface EngineResult {
  round: NegotiationRound;
  decision: AllocationDecision;
  updatedResources: Resource[];
  updatedAgents: ResourceAgent[];
  updatedPatient: Patient;
  auditEntry: AuditLogEntry;
}

export async function runNegotiationRound(
  patient: Patient,
  resources: Resource[],
  agents: ResourceAgent[]
): Promise<EngineResult> {
  const roundId = crypto.randomUUID();
  const startedAt = Date.now();

  const events: NegotiationRound["events"] = [];
  const bids: Bid[] = [];

  // Phase 1: ANNOUNCEMENT
  const cfpEvent = {
    id: crypto.randomUUID(),
    roundId,
    type: "CFP_BROADCAST" as const,
    agentId: null,
    patientId: patient.id,
    payload: { requiredTypes: patient.requiresResourceTypes },
    timestamp: Date.now(),
  };
  events.push(cfpEvent);

  // Phase 2: BIDDING — eligible resources compute bids
  const eligibleResources = resources.filter(
    (r) =>
      patient.requiresResourceTypes.includes(r.type) &&
      (r.status === "AVAILABLE" || r.status === "RESERVED")
  );

  for (const resource of eligibleResources) {
    const breakdown = computeBidScore(resource, patient);
    if (breakdown.availabilityScore === 0) continue;

    const bid: Bid = {
      id: crypto.randomUUID(),
      agentId: resource.id,
      resourceId: resource.id,
      patientId: patient.id,
      roundId,
      score: breakdown.finalScore,
      confidence: breakdown.finalScore / 100,
      breakdown,
      timestamp: Date.now(),
      accepted: null,
    };
    bids.push(bid);

    events.push({
      id: crypto.randomUUID(),
      roundId,
      type: "BID_SUBMITTED",
      agentId: resource.id,
      patientId: patient.id,
      payload: { score: breakdown.finalScore, breakdown },
      timestamp: Date.now(),
    });
  }

  // Phase 3: EVALUATION — pick best bid per required resource type
  const winningBids: Bid[] = [];
  const allocatedResourceIds: string[] = [];
  const coveredTypes = new Set<string>();

  const sortedBids = [...bids].sort((a, b) => b.score - a.score);

  for (const bid of sortedBids) {
    const resource = resources.find((r) => r.id === bid.resourceId);
    if (!resource) continue;
    if (coveredTypes.has(resource.type)) continue;
    if (
      !patient.requiresResourceTypes.includes(resource.type)
    )
      continue;

    bid.accepted = true;
    winningBids.push(bid);
    allocatedResourceIds.push(resource.id);
    coveredTypes.add(resource.type);

    events.push({
      id: crypto.randomUUID(),
      roundId,
      type: "AWARD_ISSUED",
      agentId: bid.agentId,
      patientId: patient.id,
      payload: { resourceId: resource.id, score: bid.score },
      timestamp: Date.now(),
    });
  }

  // Mark rejected bids
  bids.forEach((b) => {
    if (b.accepted === null) b.accepted = false;
  });

  const completedAt = Date.now();
  const durationMs = completedAt - startedAt;
  const outcome: AllocationDecision["outcome"] =
    winningBids.length > 0 ? "ALLOCATED" : "FAILED";

  const phase: NegotiationPhase =
    outcome === "ALLOCATED" ? "COMPLETED" : "FAILED";

  events.push({
    id: crypto.randomUUID(),
    roundId,
    type: outcome === "ALLOCATED" ? "ROUND_COMPLETED" : "ROUND_FAILED",
    agentId: null,
    patientId: patient.id,
    payload: { outcome, allocatedCount: winningBids.length },
    timestamp: completedAt,
  });

  const round: NegotiationRound = {
    id: roundId,
    patientId: patient.id,
    phase,
    startedAt,
    completedAt,
    durationMs,
    bids,
    winningBids,
    failureReason: outcome === "FAILED" ? "No available resources matching requirements" : null,
    events,
  };

  // Build decision
  const winningResources = winningBids
    .map((b) => resources.find((r) => r.id === b.resourceId))
    .filter(Boolean) as Resource[];

  const rejectedAlternatives = bids
    .filter((b) => !b.accepted)
    .slice(0, 5)
    .map((b) => ({
      resourceId: b.resourceId,
      reason: "Outbid by higher-scoring resource",
      bidScore: b.score,
    }));

  const reasoningFactors = buildReasoningFactors(
    winningBids,
    bids.filter((b) => !b.accepted),
    patient,
    resources
  );

  const naturalLanguageSummary = buildNaturalLanguageSummary(
    patient,
    winningResources,
    durationMs,
    outcome
  );

  const confidenceScore =
    winningBids.length > 0
      ? (winningBids.reduce((a, b) => a + b.score, 0) / winningBids.length)
      : 0;

  const decisionPayload = {
    roundId,
    patientId: patient.id,
    outcome,
    allocatedResourceIds,
    decidedAt: completedAt,
  };
  const auditHash = await computeAuditHash(decisionPayload);

  const decision: AllocationDecision = {
    id: crypto.randomUUID(),
    roundId,
    patientId: patient.id,
    outcome,
    allocatedResourceIds,
    rejectedAlternatives,
    reasoningFactors,
    naturalLanguageSummary,
    confidenceScore,
    decisionTimeMs: durationMs,
    decidedAt: completedAt,
    auditHash,
  };

  // Update resources
  const updatedResources = resources.map((r) => {
    if (!allocatedResourceIds.includes(r.id)) {
      const newHistory = [...r.utilizationHistory, 0].slice(-60);
      return { ...r, utilizationHistory: newHistory };
    }
    const newHistory = [...r.utilizationHistory, 1].slice(-60);
    return {
      ...r,
      status: "OCCUPIED" as const,
      currentPatientId: patient.id,
      utilizationHistory: newHistory,
      updatedAt: completedAt,
    };
  });

  // Update agents
  const updatedAgents = agents.map((a) => {
    const won = allocatedResourceIds.includes(a.resourceId);
    const bid = bids.find((b) => b.resourceId === a.resourceId);
    if (!bid) return a;

    return {
      ...a,
      state: won ? ("ALLOCATED" as const) : ("IDLE" as const),
      currentPatientId: won ? patient.id : a.currentPatientId,
      performanceMetrics: {
        totalAllocations: a.performanceMetrics.totalAllocations + (won ? 1 : 0),
        bidsSubmitted: a.performanceMetrics.bidsSubmitted + 1,
        bidsWon: a.performanceMetrics.bidsWon + (won ? 1 : 0),
        averageBidScore:
          (a.performanceMetrics.averageBidScore * a.performanceMetrics.bidsSubmitted + bid.score) /
          (a.performanceMetrics.bidsSubmitted + 1),
      },
    };
  });

  // Update patient
  const updatedPatient: Patient = {
    ...patient,
    status: outcome === "ALLOCATED" ? "ALLOCATED" : "WAITING",
    allocatedResources:
      outcome === "ALLOCATED" ? allocatedResourceIds : patient.allocatedResources,
    treatmentStartedAt:
      outcome === "ALLOCATED" ? completedAt : patient.treatmentStartedAt,
    triageScore: computeTriageScore(
      patient.condition,
      patient.vitals,
      patient.arrivedAt
    ),
  };

  const auditEntry: AuditLogEntry = {
    id: crypto.randomUUID(),
    entityType: "DECISION",
    entityId: decision.id,
    action:
      outcome === "ALLOCATED"
        ? "PATIENT_ALLOCATED"
        : "ALLOCATION_FAILED",
    actorType: "AGENT",
    decision,
    timestamp: completedAt,
  };

  return {
    round,
    decision,
    updatedResources,
    updatedAgents,
    updatedPatient,
    auditEntry,
  };
}

// ─── Discharge logic ─────────────────────────────────────────────────────────

export function processDischarges(
  patients: Patient[],
  resources: Resource[],
  agents: ResourceAgent[]
): {
  updatedPatients: Patient[];
  updatedResources: Resource[];
  updatedAgents: ResourceAgent[];
} {
  const now = Date.now();
  const updatedPatients = [...patients];
  const updatedResources = [...resources];
  const updatedAgents = [...agents];

  for (let i = 0; i < updatedPatients.length; i++) {
    const p = updatedPatients[i];
    if (
      p.status === "ALLOCATED" &&
      p.treatmentStartedAt !== null &&
      now - p.treatmentStartedAt >= p.estimatedTreatmentDuration
    ) {
      updatedPatients[i] = { ...p, status: "DISCHARGED", dischargedAt: now };

      for (const rId of p.allocatedResources) {
        const rIdx = updatedResources.findIndex((r) => r.id === rId);
        if (rIdx >= 0) {
          updatedResources[rIdx] = {
            ...updatedResources[rIdx],
            status: "AVAILABLE",
            currentPatientId: null,
            updatedAt: now,
          };
        }
        const aIdx = updatedAgents.findIndex((a) => a.resourceId === rId);
        if (aIdx >= 0) {
          updatedAgents[aIdx] = {
            ...updatedAgents[aIdx],
            state: "IDLE",
            currentPatientId: null,
          };
        }
      }
    }
  }

  return { updatedPatients, updatedResources, updatedAgents };
}
