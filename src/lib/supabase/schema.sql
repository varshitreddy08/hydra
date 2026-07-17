-- ═══════════════════════════════════════════════════════════════════════════
-- MEDRESPONSE — Emergency Resource Allocation Platform
-- Tenant-isolated multi-hospital schema with RBAC
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── 1. HOSPITALS (tenants) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hospitals (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  code          TEXT        UNIQUE NOT NULL,
  address       TEXT,
  city          TEXT,
  state         TEXT,
  phone         TEXT,
  email         TEXT,
  lat           DECIMAL(10,8),
  lng           DECIMAL(11,8),
  status        TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','active','suspended')),
  tier          TEXT        NOT NULL DEFAULT 'standard'
                            CHECK (tier IN ('basic','standard','premium')),
  total_icu_beds    INTEGER DEFAULT 0,
  total_ventilators INTEGER DEFAULT 0,
  total_doctors     INTEGER DEFAULT 0,
  total_ambulances  INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. PROFILES (users + roles) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  email         TEXT,
  role          TEXT        NOT NULL
                            CHECK (role IN (
                              'platform_admin',
                              'hospital_admin',
                              'resource_manager',
                              'emergency_doctor'
                            )),
  hospital_id   UUID        REFERENCES hospitals(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'emergency_doctor')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─── 3. RESOURCES (tenant-isolated) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resources (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id     UUID    NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  type            TEXT    NOT NULL
                          CHECK (type IN (
                            'ICU_BED','VENTILATOR','OPERATION_THEATER',
                            'AMBULANCE','EMERGENCY_ROOM','DOCTOR',
                            'SPECIALIST','BLOOD_BANK','CT_SCANNER','DEFIBRILLATOR'
                          )),
  name            TEXT    NOT NULL,
  status          TEXT    NOT NULL DEFAULT 'AVAILABLE'
                          CHECK (status IN (
                            'AVAILABLE','OCCUPIED','RESERVED','MAINTENANCE','OFFLINE'
                          )),
  specialization  TEXT,
  location        TEXT,
  current_request_id UUID,
  last_updated    TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 4. EMERGENCY REQUESTS (minimum patient data — no PII) ──────────────────
CREATE TABLE IF NOT EXISTS emergency_requests (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id     UUID    NOT NULL REFERENCES hospitals(id),
  patient_token   TEXT    NOT NULL,
  severity        TEXT    NOT NULL
                          CHECK (severity IN ('CRITICAL','HIGH','MODERATE','LOW')),
  blood_group     TEXT    CHECK (blood_group IN (
                            'A+','A-','B+','B-','AB+','AB-','O+','O-','UNKNOWN'
                          )),
  needed_resources TEXT[] NOT NULL DEFAULT '{}',
  eta_minutes     INTEGER,
  status          TEXT    NOT NULL DEFAULT 'PENDING'
                          CHECK (status IN (
                            'PENDING','NEGOTIATING','ALLOCATED',
                            'TRANSFERRED','COMPLETED','CANCELLED'
                          )),
  clinical_note   TEXT,
  created_by      UUID    REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 5. NEGOTIATIONS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS negotiations (
  id                    UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id            UUID    NOT NULL REFERENCES emergency_requests(id),
  requesting_hospital_id UUID   NOT NULL REFERENCES hospitals(id),
  status                TEXT    NOT NULL DEFAULT 'IN_PROGRESS'
                                CHECK (status IN (
                                  'IN_PROGRESS','COMPLETED','FAILED','CANCELLED'
                                )),
  round_number          INTEGER DEFAULT 1,
  started_at            TIMESTAMPTZ DEFAULT NOW(),
  completed_at          TIMESTAMPTZ,
  winning_hospital_id   UUID    REFERENCES hospitals(id),
  overall_score         DECIMAL(5,2),
  summary               TEXT
);

-- ─── 6. NEGOTIATION BIDS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS negotiation_bids (
  id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  negotiation_id      UUID    NOT NULL REFERENCES negotiations(id) ON DELETE CASCADE,
  bidding_hospital_id UUID    NOT NULL REFERENCES hospitals(id),
  resource_type       TEXT    NOT NULL,
  available_count     INTEGER DEFAULT 0,
  score               DECIMAL(5,2),
  score_breakdown     JSONB,
  status              TEXT    NOT NULL DEFAULT 'PENDING'
                              CHECK (status IN ('PENDING','ACCEPTED','REJECTED')),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 7. DECISIONS (explainable AI) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS decisions (
  id                    UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  negotiation_id        UUID    REFERENCES negotiations(id),
  request_id            UUID    NOT NULL REFERENCES emergency_requests(id),
  winning_hospital_id   UUID    REFERENCES hospitals(id),
  allocated_resources   JSONB,
  reasoning_factors     JSONB,
  natural_language_summary TEXT,
  confidence_score      DECIMAL(5,2),
  decision_time_ms      INTEGER,
  audit_hash            TEXT,
  decided_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 8. AUDIT LOGS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID    REFERENCES profiles(id),
  user_role     TEXT,
  hospital_id   UUID    REFERENCES hospitals(id),
  hospital_name TEXT,
  action        TEXT    NOT NULL,
  entity_type   TEXT,
  entity_id     TEXT,
  metadata      JSONB,
  ip_address    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 9. SYSTEM CONFIG ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_config (
  key           TEXT    PRIMARY KEY,
  value         JSONB   NOT NULL,
  description   TEXT,
  updated_by    UUID    REFERENCES profiles(id),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO system_config (key, value, description) VALUES
  ('ai_scoring_weights', '{
    "availability": 0.40,
    "distance": 0.25,
    "doctor_availability": 0.15,
    "ambulance_eta": 0.10,
    "hospital_load": 0.10
  }', 'Weights used by the negotiation scoring engine'),
  ('emergency_config', '{
    "max_negotiation_rounds": 3,
    "negotiation_timeout_seconds": 30,
    "auto_escalate_critical": true,
    "min_hospitals_to_negotiate": 2
  }', 'Emergency negotiation configuration')
ON CONFLICT (key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE hospitals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources          ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiation_bids   ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config      ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION auth_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION auth_hospital_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT hospital_id FROM public.profiles WHERE id = auth.uid()
$$;

-- hospitals policies
CREATE POLICY "platform_admin_hospitals_all" ON hospitals
  FOR ALL USING (auth_role() = 'platform_admin');

CREATE POLICY "all_read_active_hospitals" ON hospitals
  FOR SELECT USING (auth.uid() IS NOT NULL AND status = 'active');

-- profiles policies
CREATE POLICY "users_own_profile" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "platform_admin_all_profiles" ON profiles
  FOR ALL USING (auth_role() = 'platform_admin');

CREATE POLICY "hospital_admin_hospital_profiles" ON profiles
  FOR SELECT USING (
    auth_role() = 'hospital_admin' AND hospital_id = auth_hospital_id()
  );

-- resources policies
CREATE POLICY "hospital_users_own_resources" ON resources
  FOR ALL USING (
    auth.uid() IS NOT NULL AND hospital_id = auth_hospital_id()
  );

CREATE POLICY "all_read_active_hospital_resources" ON resources
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    EXISTS (SELECT 1 FROM hospitals h WHERE h.id = hospital_id AND h.status = 'active')
  );

-- emergency_requests policies
CREATE POLICY "hospital_users_own_requests" ON emergency_requests
  FOR ALL USING (
    auth.uid() IS NOT NULL AND hospital_id = auth_hospital_id()
  );

CREATE POLICY "all_read_negotiating_requests" ON emergency_requests
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND status IN ('NEGOTIATING','ALLOCATED','TRANSFERRED')
  );

-- negotiations policies
CREATE POLICY "hospital_users_own_negotiations" ON negotiations
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      requesting_hospital_id = auth_hospital_id() OR
      winning_hospital_id = auth_hospital_id()
    )
  );

CREATE POLICY "platform_admin_all_negotiations" ON negotiations
  FOR ALL USING (auth_role() = 'platform_admin');

-- negotiation_bids policies
CREATE POLICY "hospital_users_bids" ON negotiation_bids
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      bidding_hospital_id = auth_hospital_id() OR
      EXISTS (
        SELECT 1 FROM negotiations n
        WHERE n.id = negotiation_id
        AND n.requesting_hospital_id = auth_hospital_id()
      )
    )
  );

-- decisions policies
CREATE POLICY "hospital_users_decisions" ON decisions
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      winning_hospital_id = auth_hospital_id() OR
      EXISTS (
        SELECT 1 FROM emergency_requests r
        WHERE r.id = request_id AND r.hospital_id = auth_hospital_id()
      )
    )
  );

CREATE POLICY "platform_admin_all_decisions" ON decisions
  FOR ALL USING (auth_role() = 'platform_admin');

CREATE POLICY "system_insert_decisions" ON decisions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- audit_logs policies
CREATE POLICY "platform_admin_audit_logs" ON audit_logs
  FOR ALL USING (auth_role() = 'platform_admin');

CREATE POLICY "hospital_admin_own_audit" ON audit_logs
  FOR SELECT USING (
    auth_role() = 'hospital_admin' AND hospital_id = auth_hospital_id()
  );

CREATE POLICY "insert_audit_logs" ON audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- system_config policies
CREATE POLICY "platform_admin_system_config" ON system_config
  FOR ALL USING (auth_role() = 'platform_admin');

CREATE POLICY "all_read_system_config" ON system_config
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_resources_hospital        ON resources(hospital_id);
CREATE INDEX IF NOT EXISTS idx_resources_status          ON resources(status);
CREATE INDEX IF NOT EXISTS idx_emergency_requests_hosp   ON emergency_requests(hospital_id);
CREATE INDEX IF NOT EXISTS idx_emergency_requests_status ON emergency_requests(status);
CREATE INDEX IF NOT EXISTS idx_negotiations_request      ON negotiations(request_id);
CREATE INDEX IF NOT EXISTS idx_bids_negotiation          ON negotiation_bids(negotiation_id);
CREATE INDEX IF NOT EXISTS idx_decisions_request         ON decisions(request_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_hospital       ON audit_logs(hospital_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created        ON audit_logs(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO hospitals (id, name, code, city, state, lat, lng, status, tier,
  total_icu_beds, total_ventilators, total_doctors, total_ambulances)
VALUES
  ('11111111-0000-0000-0000-000000000001','Apollo General Hospital','HOSP-001','Hyderabad','Telangana',17.3850,78.4867,'active','premium',20,15,50,6),
  ('11111111-0000-0000-0000-000000000002','CARE Hospitals','HOSP-002','Hyderabad','Telangana',17.4399,78.4983,'active','standard',15,10,35,4),
  ('11111111-0000-0000-0000-000000000003','Yashoda Hospitals','HOSP-003','Secunderabad','Telangana',17.4416,78.4986,'active','standard',12,8,28,3),
  ('11111111-0000-0000-0000-000000000004','Kamineni Hospital','HOSP-004','Hyderabad','Telangana',17.3653,78.5095,'active','basic',10,6,20,2),
  ('11111111-0000-0000-0000-000000000005','Star Hospitals','HOSP-005','Hyderabad','Telangana',17.4231,78.4487,'pending','standard',8,5,18,2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO resources (hospital_id, type, name, status, specialization, location) VALUES
  ('11111111-0000-0000-0000-000000000001','ICU_BED','ICU-A01','AVAILABLE',NULL,'Wing A'),
  ('11111111-0000-0000-0000-000000000001','ICU_BED','ICU-A02','AVAILABLE',NULL,'Wing A'),
  ('11111111-0000-0000-0000-000000000001','ICU_BED','ICU-A03','OCCUPIED',NULL,'Wing A'),
  ('11111111-0000-0000-0000-000000000001','VENTILATOR','VENT-01','AVAILABLE',NULL,'ICU'),
  ('11111111-0000-0000-0000-000000000001','VENTILATOR','VENT-02','AVAILABLE',NULL,'ICU'),
  ('11111111-0000-0000-0000-000000000001','DOCTOR','DR-CARDIAC-01','AVAILABLE','CARDIOLOGIST','Cardiology'),
  ('11111111-0000-0000-0000-000000000001','DOCTOR','DR-NEURO-01','AVAILABLE','NEUROLOGIST','Neurology'),
  ('11111111-0000-0000-0000-000000000001','AMBULANCE','AMB-001','AVAILABLE',NULL,'Bay 1'),
  ('11111111-0000-0000-0000-000000000001','OPERATION_THEATER','OT-01','AVAILABLE',NULL,'Floor 2'),
  ('11111111-0000-0000-0000-000000000002','ICU_BED','ICU-C01','AVAILABLE',NULL,'Critical Care'),
  ('11111111-0000-0000-0000-000000000002','ICU_BED','ICU-C02','OCCUPIED',NULL,'Critical Care'),
  ('11111111-0000-0000-0000-000000000002','VENTILATOR','VENT-C01','AVAILABLE',NULL,'ICU'),
  ('11111111-0000-0000-0000-000000000002','DOCTOR','DR-TRAUMA-01','AVAILABLE','TRAUMA_SURGEON','Trauma'),
  ('11111111-0000-0000-0000-000000000002','AMBULANCE','AMB-C01','AVAILABLE',NULL,'Bay 1'),
  ('11111111-0000-0000-0000-000000000003','ICU_BED','ICU-Y01','AVAILABLE',NULL,'ICU'),
  ('11111111-0000-0000-0000-000000000003','VENTILATOR','VENT-Y01','MAINTENANCE',NULL,'ICU'),
  ('11111111-0000-0000-0000-000000000003','DOCTOR','DR-ORTHO-01','AVAILABLE','ORTHOPEDIST','Orthopedics'),
  ('11111111-0000-0000-0000-000000000003','AMBULANCE','AMB-Y01','AVAILABLE',NULL,'Bay 1')
ON CONFLICT DO NOTHING;
