// ─── Resource Types ──────────────────────────────────────────────────────────

export type ResourceType =
  | "OPERATING_ROOM"
  | "ICU_BED"
  | "EMERGENCY_BAY"
  | "VENTILATOR"
  | "CT_SCANNER"
  | "SURGEON"
  | "ANESTHESIOLOGIST"
  | "NURSE_ICU"
  | "NURSE_ED"
  | "CARDIOLOGIST"
  | "TRAUMA_SURGEON"
  | "DEFIBRILLATOR"
  | "BLOOD_BANK";

export type ResourceStatus =
  | "AVAILABLE"
  | "OCCUPIED"
  | "RESERVED"
  | "MAINTENANCE"
  | "OFFLINE";

export interface Resource {
  id: string;
  type: ResourceType;
  name: string;
  status: ResourceStatus;
  location: string;
  capabilities: string[];
  currentPatientId: string | null;
  utilizationHistory: number[]; // last 60 ticks: 0=idle, 1=occupied
  createdAt: number;
  updatedAt: number;
}

export interface ResourceDependency {
  from: ResourceType;
  to: ResourceType;
  dependencyType: "REQUIRES" | "PREFERS";
  description: string;
}

// ─── Patient Types ───────────────────────────────────────────────────────────

export type TriageLevel =
  | "P1_IMMEDIATE"
  | "P2_EMERGENT"
  | "P3_URGENT"
  | "P4_LESS_URGENT"
  | "P5_NON_URGENT";

export type PatientStatus =
  | "WAITING"
  | "IN_NEGOTIATION"
  | "ALLOCATED"
  | "IN_TREATMENT"
  | "DISCHARGED";

export type ClinicalCondition =
  | "CARDIAC_ARREST"
  | "TRAUMA_MAJOR"
  | "STROKE_ISCHEMIC"
  | "STROKE_HEMORRHAGIC"
  | "SEPSIS"
  | "RESPIRATORY_FAILURE"
  | "BURNS_MAJOR"
  | "POLYTRAUMA"
  | "ANAPHYLAXIS"
  | "OVERDOSE";

export interface Vitals {
  heartRate: number;
  systolicBP: number;
  diastolicBP: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  temperature: number;
  consciousnessScore: number; // GCS 3-15
  timestamp: number;
}

export interface TriageScore {
  raw: number; // 0-100
  triageLevel: TriageLevel;
  mewsScore: number; // 0-14
  esiScore: number; // 1-5
  timeFactorPenalty: number;
  conditionWeight: number;
  breakdown: {
    vitalScore: number;
    conditionScore: number;
    waitTimeScore: number;
  };
  computedAt: number;
}

export interface Patient {
  id: string;
  mrn: string;
  age: number;
  sex: "M" | "F" | "OTHER";
  condition: ClinicalCondition;
  conditionDetails: string;
  triageScore: TriageScore;
  vitals: Vitals;
  vitalsHistory: Vitals[];
  status: PatientStatus;
  allocatedResources: string[];
  requiresResourceTypes: ResourceType[];
  requiredCapabilities: string[];
  arrivedAt: number;
  treatmentStartedAt: number | null;
  dischargedAt: number | null;
  estimatedTreatmentDuration: number;
}

// ─── Agent Types ─────────────────────────────────────────────────────────────

export type AgentState =
  | "IDLE"
  | "LISTENING"
  | "BIDDING"
  | "BID_ACCEPTED"
  | "BID_REJECTED"
  | "ALLOCATED"
  | "RELEASING"
  | "MAINTENANCE"
  | "BLOCKED";

export interface BidBreakdown {
  availabilityScore: number;
  capabilityScore: number;
  proximityScore: number;
  utilizationPenalty: number;
  specialtyBonus: number;
  urgencyMultiplier: number;
  finalScore: number;
}

export interface Bid {
  id: string;
  agentId: string;
  resourceId: string;
  patientId: string;
  roundId: string;
  score: number;
  confidence: number;
  breakdown: BidBreakdown;
  timestamp: number;
  accepted: boolean | null;
}

export interface ResourceAgent {
  id: string;
  resourceId: string;
  state: AgentState;
  currentBid: Bid | null;
  currentPatientId: string | null;
  performanceMetrics: {
    totalAllocations: number;
    bidsSubmitted: number;
    bidsWon: number;
    averageBidScore: number;
  };
}

// ─── Negotiation Types ───────────────────────────────────────────────────────

export type NegotiationPhase =
  | "IDLE"
  | "ANNOUNCEMENT"
  | "BIDDING"
  | "EVALUATION"
  | "DEPENDENCY_CHECK"
  | "AWARD"
  | "COMPLETED"
  | "FAILED";

export interface NegotiationEvent {
  id: string;
  roundId: string;
  type:
    | "CFP_BROADCAST"
    | "BID_SUBMITTED"
    | "BID_EVALUATED"
    | "DEPENDENCY_RESOLVED"
    | "DEPENDENCY_FAILED"
    | "AWARD_ISSUED"
    | "ROUND_COMPLETED"
    | "ROUND_FAILED";
  agentId: string | null;
  patientId: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

export interface NegotiationRound {
  id: string;
  patientId: string;
  phase: NegotiationPhase;
  startedAt: number;
  completedAt: number | null;
  durationMs: number | null;
  bids: Bid[];
  winningBids: Bid[];
  failureReason: string | null;
  events: NegotiationEvent[];
}

// ─── Decision Types ──────────────────────────────────────────────────────────

export type DecisionOutcome = "ALLOCATED" | "QUEUED" | "FAILED";

export interface ReasoningFactor {
  factor: string;
  value: string | number;
  weight: number;
  direction: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  explanation: string;
}

export interface AllocationDecision {
  id: string;
  roundId: string;
  patientId: string;
  outcome: DecisionOutcome;
  allocatedResourceIds: string[];
  rejectedAlternatives: {
    resourceId: string;
    reason: string;
    bidScore: number;
  }[];
  reasoningFactors: ReasoningFactor[];
  naturalLanguageSummary: string;
  confidenceScore: number;
  decisionTimeMs: number;
  decidedAt: number;
  auditHash: string;
}

export interface AuditLogEntry {
  id: string;
  entityType: "PATIENT" | "RESOURCE" | "NEGOTIATION" | "DECISION" | "SYSTEM";
  entityId: string;
  action: string;
  actorType: "AGENT" | "USER" | "SYSTEM";
  decision: AllocationDecision | null;
  timestamp: number;
}

// ─── Simulation Types ────────────────────────────────────────────────────────

export interface SimulationConfig {
  tickIntervalMs: number;
  maxNegotiationIterations: number;
  criticalPriorityBoost: number;
}

export type SimulationStatus = "IDLE" | "RUNNING" | "PAUSED";

export interface SimulationMetrics {
  totalPatientsAdmitted: number;
  totalAllocations: number;
  totalFailed: number;
  avgDecisionTimeMs: number;
  resourceUtilization: number; // 0-1
  activeNegotiations: number;
  patientsInQueue: number;
}

// ─── Analytics Types ─────────────────────────────────────────────────────────

export interface UtilizationDataPoint {
  tick: number;
  timestamp: number;
  utilization: number;
  activePatients: number;
  availableResources: number;
}

export interface NegotiationOutcomeData {
  tick: number;
  allocated: number;
  failed: number;
  avgDecisionMs: number;
}
