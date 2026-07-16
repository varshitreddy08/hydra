-- ─── Hospital Negotiation — Supabase Schema ──────────────────────────────────
-- Run this in the Supabase SQL Editor to set up the database

-- 1. Profiles table (extends auth.users with role)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('admin', 'viewer')),
  full_name text,
  created_at timestamptz not null default now()
);

-- 2. Decisions table (persisted from simulation)
create table if not exists public.decisions (
  id text primary key,
  round_id text not null,
  patient_id text not null,
  outcome text not null check (outcome in ('ALLOCATED', 'QUEUED', 'FAILED')),
  allocated_resource_ids text[] not null default '{}',
  reasoning_factors jsonb not null default '[]',
  natural_language_summary text not null,
  confidence_score numeric not null,
  decision_time_ms integer not null,
  audit_hash text not null,
  decided_at timestamptz not null default now()
);

-- 3. Audit log table
create table if not exists public.audit_log (
  id text primary key,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  actor_type text not null,
  timestamp timestamptz not null default now()
);

-- ─── Row Level Security ──────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.decisions enable row level security;
alter table public.audit_log enable row level security;

-- Profiles: users can only see their own profile
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Decisions: all authenticated users can read
create policy "Authenticated users can read decisions"
  on public.decisions for select
  to authenticated
  using (true);

-- Decisions: all authenticated users can insert (simulation writes)
create policy "Authenticated users can insert decisions"
  on public.decisions for insert
  to authenticated
  with check (true);

-- Audit log: all authenticated users can read
create policy "Authenticated users can read audit log"
  on public.audit_log for select
  to authenticated
  using (true);

-- Audit log: all authenticated users can insert
create policy "Authenticated users can insert audit log"
  on public.audit_log for insert
  to authenticated
  with check (true);

-- ─── Enable Realtime ─────────────────────────────────────────────────────────

alter publication supabase_realtime add table public.decisions;
alter publication supabase_realtime add table public.audit_log;

-- ─── Trigger: auto-create profile on user signup ─────────────────────────────

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'viewer')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Demo Users ──────────────────────────────────────────────────────────────
-- After running this schema, create two users in Supabase Auth dashboard:
--   1. admin@hospital.demo  / HospitalAdmin@2026   → role: admin
--   2. viewer@hospital.demo / HospitalView@2026    → role: viewer
--
-- Then update their roles:
-- update public.profiles set role = 'admin' where id = '<admin-user-id>';
