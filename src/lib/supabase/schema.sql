-- Run this once in Supabase SQL Editor to create the resources table

CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  hospital_id TEXT NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'AVAILABLE',
  location TEXT NOT NULL DEFAULT '',
  capabilities TEXT[] NOT NULL DEFAULT '{}',
  current_patient_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on resources" ON resources
  FOR ALL USING (true);

-- ─── Patients table ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  mrn TEXT NOT NULL,
  age INTEGER NOT NULL,
  sex TEXT NOT NULL,
  condition TEXT NOT NULL,
  condition_details TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'WAITING',
  vitals JSONB NOT NULL DEFAULT '{}',
  vitals_history JSONB NOT NULL DEFAULT '[]',
  triage_score JSONB NOT NULL DEFAULT '{}',
  allocated_resources TEXT[] NOT NULL DEFAULT '{}',
  requires_resource_types TEXT[] NOT NULL DEFAULT '{}',
  required_capabilities TEXT[] NOT NULL DEFAULT '{}',
  arrived_at TIMESTAMPTZ NOT NULL,
  treatment_started_at TIMESTAMPTZ,
  discharged_at TIMESTAMPTZ,
  estimated_treatment_duration INTEGER NOT NULL DEFAULT 0,
  referred_hospital_ids TEXT[] NOT NULL DEFAULT '{}',
  admitted_by_hospital_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All access on patients" ON patients
  FOR ALL USING (true);
