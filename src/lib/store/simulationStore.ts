"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type {
  Patient,
  Resource,
  ResourceAgent,
  Hospital,
  NegotiationRound,
  AllocationDecision,
  AuditLogEntry,
  SimulationStatus,
  SimulationMetrics,
  UtilizationDataPoint,
  NegotiationOutcomeData,
} from "@/types";
import {
  seedResources,
  seedPatients,
  seedAgents,
  seedHospitals,
  generateRandomPatient,
} from "@/lib/simulation/seed";
import {
  runNegotiationRound,
  processDischarges,
  computeTriageScore,
} from "@/lib/simulation/engine";
import { createClient } from "@/lib/supabase/client";

const TICK_INTERVAL_MS = 4000;
const MAX_DECISIONS = 200;
const MAX_AUDIT_LOG = 500;
const MAX_ROUNDS = 100;
const PATIENT_ARRIVAL_PROBABILITY = 0.3; // 30% chance per tick

export type LocationPermission = "unknown" | "requesting" | "granted" | "denied";

interface SimulationStore {
  // User location (global, requested on app startup)
  userLocation: { lat: number; lng: number } | null;
  locationPermission: LocationPermission;
  setUserLocation: (pos: { lat: number; lng: number } | null) => void;
  setLocationPermission: (status: LocationPermission) => void;

  // Core state
  hospitals: Hospital[];
  patients: Patient[];
  resources: Resource[];
  agents: ResourceAgent[];
  rounds: NegotiationRound[];
  decisions: AllocationDecision[];
  auditLog: AuditLogEntry[];

  // Simulation control
  status: SimulationStatus;
  tick: number;
  intervalId: ReturnType<typeof setInterval> | null;

  // Analytics
  utilizationHistory: UtilizationDataPoint[];
  outcomeHistory: NegotiationOutcomeData[];

  // Active negotiation for visualization
  activeRound: NegotiationRound | null;

  // Actions
  start: () => void;
  pause: () => void;
  reset: () => void;
  admitPatient: (
    patient: Omit<
      Patient,
      | "triageScore"
      | "vitalsHistory"
      | "status"
      | "allocatedResources"
      | "treatmentStartedAt"
      | "dischargedAt"
    >
  ) => void;
  addHospital: (hospital: Omit<Hospital, "id" | "createdAt">) => void;
  loadHospitalsFromDB: () => Promise<void>;
  addResource: (resource: Omit<Resource, "id" | "utilizationHistory" | "currentPatientId" | "createdAt" | "updatedAt">) => ResourceAgent;
  updateResource: (id: string, patch: Partial<Pick<Resource, "name" | "location" | "status" | "capabilities">>) => void;
  discardPatient: (patientId: string) => void;
  forceAllocate: (patientId: string) => Promise<void>;
  forceAllocateToHospital: (patientId: string, hospitalId: string) => Promise<void>;
  tick_: () => Promise<void>;
  getMetrics: () => SimulationMetrics;
}

async function persistDecision(decision: AllocationDecision) {
  try {
    const supabase = createClient();
    await supabase.from("decisions").insert({
      id: decision.id,
      round_id: decision.roundId,
      patient_id: decision.patientId,
      outcome: decision.outcome,
      allocated_resource_ids: decision.allocatedResourceIds,
      reasoning_factors: decision.reasoningFactors,
      natural_language_summary: decision.naturalLanguageSummary,
      confidence_score: decision.confidenceScore,
      decision_time_ms: decision.decisionTimeMs,
      audit_hash: decision.auditHash,
      decided_at: new Date(decision.decidedAt).toISOString(),
    });
  } catch {
    // Non-critical: simulation continues even if DB write fails
  }
}

async function persistAuditEntry(entry: AuditLogEntry) {
  try {
    const supabase = createClient();
    await supabase.from("audit_log").insert({
      id: entry.id,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      action: entry.action,
      actor_type: entry.actorType,
      timestamp: new Date(entry.timestamp).toISOString(),
    });
  } catch {
    // Non-critical
  }
}

export const useSimulationStore = create<SimulationStore>()(
  subscribeWithSelector((set, get) => ({
    userLocation: null,
    locationPermission: "unknown" as LocationPermission,
    setUserLocation: (pos) => set({ userLocation: pos }),
    setLocationPermission: (status) => set({ locationPermission: status }),

    hospitals: seedHospitals(),
    patients: seedPatients(),
    resources: seedResources(),
    agents: seedAgents(seedResources()),
    rounds: [],
    decisions: [],
    auditLog: [],
    status: "IDLE",
    tick: 0,
    intervalId: null,
    utilizationHistory: [],
    outcomeHistory: [],
    activeRound: null,

    start: () => {
      const existing = get().intervalId;
      if (existing) clearInterval(existing);

      const id = setInterval(async () => {
        await get().tick_();
      }, TICK_INTERVAL_MS);

      set({ status: "RUNNING", intervalId: id });
    },

    pause: () => {
      const id = get().intervalId;
      if (id) clearInterval(id);
      set({ status: "PAUSED", intervalId: null });
    },

    reset: () => {
      const id = get().intervalId;
      if (id) clearInterval(id);
      const freshResources = seedResources();
      set({
        hospitals: seedHospitals(),
        patients: seedPatients(),
        resources: freshResources,
        agents: seedAgents(freshResources),
        rounds: [],
        decisions: [],
        auditLog: [],
        status: "IDLE",
        tick: 0,
        intervalId: null,
        utilizationHistory: [],
        outcomeHistory: [],
        activeRound: null,
      });
    },

    addHospital: (hospitalData) => {
      const hospital: Hospital = {
        ...hospitalData,
        id: `hospital-${crypto.randomUUID()}`,
        createdAt: Date.now(),
      };
      set((state) => ({ hospitals: [...state.hospitals, hospital] }));
      // Persist to Supabase
      (async () => {
        const supabase = createClient();
        const { error } = await supabase.from("hospitals").upsert({
          id: hospital.id,
          name: hospital.name,
          address: hospital.address,
          phone: hospital.phone,
          lat: hospital.lat ?? null,
          lng: hospital.lng ?? null,
          created_at: new Date(hospital.createdAt).toISOString(),
        });
        if (error) {
          console.error("[Hydra] Failed to save hospital to DB:", error.message);
        }
      })();
    },

    loadHospitalsFromDB: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("hospitals")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) {
        console.error("[Hydra] Failed to load hospitals from DB:", error.message);
        return;
      }
      if (!data || data.length === 0) return;
      const loaded: Hospital[] = data.map((row) => ({
        id: row.id,
        name: row.name,
        address: row.address ?? "",
        phone: row.phone ?? "",
        lat: row.lat ?? undefined,
        lng: row.lng ?? undefined,
        createdAt: new Date(row.created_at).getTime(),
      }));
      set({ hospitals: loaded });
    },

    addResource: (resourceData) => {
      const now = Date.now();
      const newResource: Resource = {
        ...resourceData,
        id: `res-${crypto.randomUUID()}`,
        utilizationHistory: [],
        currentPatientId: null,
        createdAt: now,
        updatedAt: now,
      };
      const newAgent: ResourceAgent = {
        id: `agent-${newResource.id}`,
        resourceId: newResource.id,
        state: newResource.status === "MAINTENANCE" ? "MAINTENANCE" : "IDLE",
        currentBid: null,
        currentPatientId: null,
        performanceMetrics: {
          totalAllocations: 0,
          bidsSubmitted: 0,
          bidsWon: 0,
          averageBidScore: 0,
        },
      };
      set((state) => ({
        resources: [...state.resources, newResource],
        agents: [...state.agents, newAgent],
      }));
      return newAgent;
    },

    updateResource: (id, patch) => {
      set((state) => ({
        resources: state.resources.map((r) =>
          r.id === id ? { ...r, ...patch, updatedAt: Date.now() } : r
        ),
        agents: state.agents.map((a) =>
          a.resourceId === id && patch.status
            ? {
                ...a,
                state:
                  patch.status === "MAINTENANCE"
                    ? ("MAINTENANCE" as const)
                    : a.state === "MAINTENANCE"
                    ? ("IDLE" as const)
                    : a.state,
              }
            : a
        ),
      }));
    },

    discardPatient: (patientId) => {
      const now = Date.now();
      set((state) => ({
        patients: state.patients.map((p) =>
          p.id === patientId
            ? { ...p, status: "DISCHARGED" as const, dischargedAt: now }
            : p
        ),
        // Free any resources held by this patient
        resources: state.resources.map((r) =>
          r.currentPatientId === patientId
            ? { ...r, status: "AVAILABLE" as const, currentPatientId: null, updatedAt: now }
            : r
        ),
        agents: state.agents.map((a) =>
          a.currentPatientId === patientId
            ? { ...a, state: "IDLE" as const, currentPatientId: null, currentBid: null }
            : a
        ),
      }));
    },

    forceAllocate: async (patientId) => {
      const state = get();
      const patient = state.patients.find((p) => p.id === patientId);
      if (!patient || patient.status === "DISCHARGED" || patient.status === "ALLOCATED") return;

      set((s) => ({
        patients: s.patients.map((p) =>
          p.id === patientId ? { ...p, status: "IN_NEGOTIATION" as const } : p
        ),
      }));

      try {
        const current = get();
        const result = await runNegotiationRound(
          { ...patient, status: "IN_NEGOTIATION" },
          current.resources,
          current.agents
        );
        const now = Date.now();
        set((s) => ({
          patients: s.patients.map((p) =>
            p.id === patientId ? result.updatedPatient : p
          ),
          resources: s.resources.map(
            (r) => result.updatedResources.find((ur) => ur.id === r.id) ?? r
          ),
          agents: s.agents.map(
            (a) => result.updatedAgents.find((ua) => ua.id === a.id) ?? a
          ),
          decisions: [result.decision, ...s.decisions].slice(0, MAX_DECISIONS),
          auditLog: [result.auditEntry, ...s.auditLog].slice(0, MAX_AUDIT_LOG),
          rounds: [result.round, ...s.rounds].slice(0, MAX_ROUNDS),
          activeRound: result.round,
        }));
        persistDecision(result.decision);
        persistAuditEntry(result.auditEntry);
      } catch {
        set((s) => ({
          patients: s.patients.map((p) =>
            p.id === patientId ? { ...p, status: "WAITING" as const } : p
          ),
        }));
      }
    },

    forceAllocateToHospital: async (patientId, hospitalId) => {
      const state = get();
      const patient = state.patients.find((p) => p.id === patientId);
      if (!patient || patient.status === "DISCHARGED" || patient.status === "ALLOCATED") return;

      set((s) => ({
        patients: s.patients.map((p) =>
          p.id === patientId ? { ...p, status: "IN_NEGOTIATION" as const } : p
        ),
      }));

      try {
        const current = get();
        const hospitalResources = current.resources.filter((r) => r.hospitalId === hospitalId);
        const resourceIds = new Set(hospitalResources.map((r) => r.id));
        const hospitalAgents = current.agents.filter((a) => resourceIds.has(a.resourceId));

        const result = await runNegotiationRound(
          { ...patient, status: "IN_NEGOTIATION" },
          hospitalResources,
          hospitalAgents
        );
        set((s) => ({
          patients: s.patients.map((p) =>
            p.id === patientId ? result.updatedPatient : p
          ),
          resources: s.resources.map(
            (r) => result.updatedResources.find((ur) => ur.id === r.id) ?? r
          ),
          agents: s.agents.map(
            (a) => result.updatedAgents.find((ua) => ua.id === a.id) ?? a
          ),
          decisions: [result.decision, ...s.decisions].slice(0, MAX_DECISIONS),
          auditLog: [result.auditEntry, ...s.auditLog].slice(0, MAX_AUDIT_LOG),
          rounds: [result.round, ...s.rounds].slice(0, MAX_ROUNDS),
          activeRound: result.round,
        }));
        persistDecision(result.decision);
        persistAuditEntry(result.auditEntry);
      } catch {
        set((s) => ({
          patients: s.patients.map((p) =>
            p.id === patientId ? { ...p, status: "WAITING" as const } : p
          ),
        }));
      }
    },

    admitPatient: (patientData) => {
      const triageScore = computeTriageScore(
        patientData.condition,
        patientData.vitals,
        patientData.arrivedAt
      );
      const newPatient: Patient = {
        ...patientData,
        triageScore,
        vitalsHistory: [patientData.vitals],
        status: "WAITING",
        allocatedResources: [],
        treatmentStartedAt: null,
        dischargedAt: null,
      };
      set((state) => ({ patients: [...state.patients, newPatient] }));
    },

    tick_: async () => {
      const state = get();
      const tickNum = state.tick + 1;
      const now = Date.now();

      // 1. Process discharges
      const { updatedPatients, updatedResources, updatedAgents } =
        processDischarges(state.patients, state.resources, state.agents);

      // 2. Randomly admit a new patient
      let currentPatients = updatedPatients;
      if (Math.random() < PATIENT_ARRIVAL_PROBABILITY && currentPatients.filter(p => p.status === "WAITING").length < 10) {
        const rawPatient = generateRandomPatient();
        const triageScore = computeTriageScore(
          rawPatient.condition,
          rawPatient.vitals,
          rawPatient.arrivedAt
        );
        const newPatient: Patient = {
          ...rawPatient,
          triageScore,
          vitalsHistory: [rawPatient.vitals],
          status: "WAITING",
          allocatedResources: [],
          treatmentStartedAt: null,
          dischargedAt: null,
        };
        currentPatients = [...currentPatients, newPatient];
      }

      // 3. Find highest-priority waiting patient
      const waitingPatients = currentPatients
        .filter((p) => p.status === "WAITING")
        .sort((a, b) => b.triageScore.raw - a.triageScore.raw);

      let finalPatients = currentPatients;
      let finalResources = updatedResources;
      let finalAgents = updatedAgents;
      let newDecisions = [...state.decisions];
      let newAuditLog = [...state.auditLog];
      let newRounds = [...state.rounds];
      let newActiveRound: NegotiationRound | null = null;
      let newOutcomePoint: NegotiationOutcomeData | null = null;

      if (waitingPatients.length > 0) {
        const topPatient = waitingPatients[0];

        // Mark as in negotiation
        finalPatients = finalPatients.map((p) =>
          p.id === topPatient.id ? { ...p, status: "IN_NEGOTIATION" as const } : p
        );

        try {
          const result = await runNegotiationRound(
            { ...topPatient, status: "IN_NEGOTIATION" },
            finalResources,
            finalAgents
          );

          // Merge updated resources and agents
          finalResources = finalResources.map(
            (r) => result.updatedResources.find((ur) => ur.id === r.id) ?? r
          );
          finalAgents = finalAgents.map(
            (a) => result.updatedAgents.find((ua) => ua.id === a.id) ?? a
          );
          finalPatients = finalPatients.map((p) =>
            p.id === topPatient.id ? result.updatedPatient : p
          );

          newRounds = [result.round, ...newRounds].slice(0, MAX_ROUNDS);
          newDecisions = [result.decision, ...newDecisions].slice(0, MAX_DECISIONS);
          newAuditLog = [result.auditEntry, ...newAuditLog].slice(0, MAX_AUDIT_LOG);
          newActiveRound = result.round;

          newOutcomePoint = {
            tick: tickNum,
            allocated: result.decision.outcome === "ALLOCATED" ? 1 : 0,
            failed: result.decision.outcome === "FAILED" ? 1 : 0,
            avgDecisionMs: result.decision.decisionTimeMs,
          };

          // Persist to Supabase (non-blocking)
          persistDecision(result.decision);
          persistAuditEntry(result.auditEntry);
        } catch {
          // Reset patient status on error
          finalPatients = finalPatients.map((p) =>
            p.id === topPatient.id ? { ...p, status: "WAITING" as const } : p
          );
        }
      }

      // 4. Update analytics
      const occupiedCount = finalResources.filter(
        (r) => r.status === "OCCUPIED"
      ).length;
      const utilPoint: UtilizationDataPoint = {
        tick: tickNum,
        timestamp: now,
        utilization: finalResources.length > 0 ? occupiedCount / finalResources.length : 0,
        activePatients: finalPatients.filter(
          (p) => p.status === "ALLOCATED" || p.status === "IN_TREATMENT"
        ).length,
        availableResources: finalResources.filter((r) => r.status === "AVAILABLE").length,
      };

      set({
        tick: tickNum,
        patients: finalPatients,
        resources: finalResources,
        agents: finalAgents,
        rounds: newRounds,
        decisions: newDecisions,
        auditLog: newAuditLog,
        activeRound: newActiveRound,
        utilizationHistory: [
          ...state.utilizationHistory,
          utilPoint,
        ].slice(-60),
        outcomeHistory: newOutcomePoint
          ? [...state.outcomeHistory, newOutcomePoint].slice(-60)
          : state.outcomeHistory,
      });
    },

    getMetrics: () => {
      const state = get();
      const occupiedCount = state.resources.filter((r) => r.status === "OCCUPIED").length;
      const totalActive = state.patients.filter(
        (p) => p.status === "ALLOCATED" || p.status === "IN_TREATMENT"
      ).length;
      const avgDecision =
        state.decisions.length > 0
          ? state.decisions.reduce((a, d) => a + d.decisionTimeMs, 0) /
            state.decisions.length
          : 0;

      return {
        totalPatientsAdmitted: state.patients.length,
        totalAllocations: state.decisions.filter((d) => d.outcome === "ALLOCATED").length,
        totalFailed: state.decisions.filter((d) => d.outcome === "FAILED").length,
        avgDecisionTimeMs: Math.round(avgDecision),
        resourceUtilization:
          state.resources.length > 0 ? occupiedCount / state.resources.length : 0,
        activeNegotiations: state.patients.filter((p) => p.status === "IN_NEGOTIATION").length,
        patientsInQueue: state.patients.filter((p) => p.status === "WAITING").length,
      };
    },
  }))
);
