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
