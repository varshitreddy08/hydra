// ─── Hospital / Tenant Types ──────────────────────────────────────────────────

export type HospitalStatus = 'pending' | 'active' | 'suspended';
export type HospitalTier   = 'basic' | 'standard' | 'premium';

export interface Hospital {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  lat?: number;
  lng?: number;
  status: HospitalStatus;
  tier: HospitalTier;
  total_icu_beds: number;
  total_ventilators: number;
  total_doctors: number;
  total_ambulances: number;
  created_at: string;
  updated_at: string;
}

// ─── User / Auth Types ────────────────────────────────────────────────────────

export type UserRole =
  | 'platform_admin'
  | 'hospital_admin'
  | 'resource_manager'
  | 'emergency_doctor';

export interface Profile {
  id: string;
  full_name?: string;
  email?: string;
  role: UserRole;
  hospital_id?: string;
  created_at: string;
  hospital?: Hospital;
}

// ─── Resource Types ───────────────────────────────────────────────────────────

export type ResourceType =
  | 'ICU_BED'
  | 'VENTILATOR'
  | 'OPERATION_THEATER'
  | 'AMBULANCE'
  | 'EMERGENCY_ROOM'
  | 'DOCTOR'
  | 'SPECIALIST'
  | 'BLOOD_BANK'
  | 'CT_SCANNER'
  | 'DEFIBRILLATOR';

export type ResourceStatus =
  | 'AVAILABLE'
  | 'OCCUPIED'
  | 'RESERVED'
  | 'MAINTENANCE'
  | 'OFFLINE';

export interface Resource {
  id: string;
  hospital_id: string;
  type: ResourceType;
  name: string;
  status: ResourceStatus;
  specialization?: string;
  location?: string;
  current_request_id?: string;
  last_updated: string;
  created_at: string;
  hospital?: Hospital;
}

// ─── Emergency Request Types ──────────────────────────────────────────────────

export type Severity       = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
export type BloodGroup     = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'UNKNOWN';
export type RequestStatus  =
  | 'PENDING'
  | 'NEGOTIATING'
  | 'ALLOCATED'
  | 'TRANSFERRED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface EmergencyRequest {
  id: string;
  hospital_id: string;
  patient_token: string;
  severity: Severity;
  blood_group?: BloodGroup;
  needed_resources: ResourceType[];
  eta_minutes?: number;
  status: RequestStatus;
  clinical_note?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  hospital?: Hospital;
}

// ─── Negotiation Types ────────────────────────────────────────────────────────

export type NegotiationStatus = 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface Negotiation {
  id: string;
  request_id: string;
  requesting_hospital_id: string;
  status: NegotiationStatus;
  round_number: number;
  started_at: string;
  completed_at?: string;
  winning_hospital_id?: string;
  overall_score?: number;
  summary?: string;
  request?: EmergencyRequest;
  requesting_hospital?: Hospital;
  winning_hospital?: Hospital;
}

export interface ScoreBreakdown {
  availability: number;
  distance: number;
  doctor_availability: number;
  ambulance_eta: number;
  hospital_load: number;
}

export type BidStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface NegotiationBid {
  id: string;
  negotiation_id: string;
  bidding_hospital_id: string;
  resource_type: ResourceType;
  available_count: number;
  score?: number;
  score_breakdown?: ScoreBreakdown;
  status: BidStatus;
  created_at: string;
  bidding_hospital?: Hospital;
}

// ─── Decision / Explainable AI Types ─────────────────────────────────────────

export interface AllocatedResource {
  type: ResourceType;
  hospital_id: string;
  hospital_name: string;
  count: number;
}

export interface ReasoningFactors {
  availability: number;
  distance: number;
  doctor_availability: number;
  ambulance_eta: number;
  hospital_load: number;
}

export interface Decision {
  id: string;
  negotiation_id?: string;
  request_id: string;
  winning_hospital_id?: string;
  allocated_resources?: AllocatedResource[];
  reasoning_factors?: ReasoningFactors;
  natural_language_summary?: string;
  confidence_score?: number;
  decision_time_ms?: number;
  audit_hash?: string;
  decided_at: string;
  winning_hospital?: Hospital;
  request?: EmergencyRequest;
}

// ─── Audit Log Types ──────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  user_id?: string;
  user_role?: string;
  hospital_id?: string;
  hospital_name?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

// ─── System Config Types ──────────────────────────────────────────────────────

export interface AIScoringWeights {
  availability: number;
  distance: number;
  doctor_availability: number;
  ambulance_eta: number;
  hospital_load: number;
}

export interface EmergencyConfig {
  max_negotiation_rounds: number;
  negotiation_timeout_seconds: number;
  auto_escalate_critical: boolean;
  min_hospitals_to_negotiate: number;
}

// ─── Agent Types (simulation) ─────────────────────────────────────────────────

export type AgentType =
  | 'ICU_AGENT'
  | 'VENTILATOR_AGENT'
  | 'DOCTOR_AGENT'
  | 'AMBULANCE_AGENT'
  | 'OT_AGENT'
  | 'EQUIPMENT_AGENT'
  | 'PRIORITY_AGENT'
  | 'NEGOTIATION_AGENT';

export type AgentState =
  | 'IDLE'
  | 'MONITORING'
  | 'NEGOTIATING'
  | 'ALLOCATED'
  | 'OFFLINE';

export interface Agent {
  id: string;
  type: AgentType;
  hospital_id: string;
  state: AgentState;
  label: string;
  current_bid?: number;
  last_action?: string;
}

// ─── Platform Analytics Types ─────────────────────────────────────────────────

export interface PlatformStats {
  total_hospitals: number;
  active_hospitals: number;
  pending_hospitals: number;
  suspended_hospitals: number;
  total_emergency_requests_today: number;
  active_negotiations: number;
  avg_response_time_minutes: number;
  ai_success_rate: number;
}

export interface HospitalStats {
  available_icu_beds: number;
  total_icu_beds: number;
  available_ventilators: number;
  total_ventilators: number;
  available_doctors: number;
  total_doctors: number;
  available_ambulances: number;
  total_ambulances: number;
  active_emergency_requests: number;
  active_negotiations: number;
}
