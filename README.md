# MedNegotiate — Multi-Agent Emergency Resource Allocation

> **System Siege Hackathon 2026 — Problem #004: Multi-Agent Negotiation for Emergency Resource Reallocation**

An intelligent multi-agent decision-making platform that enables hospitals to rapidly and transparently reallocate critical resources during emergencies using the Contract Net Protocol (CNP).

---

## What It Does

Hospital resources (Operating Rooms, ICU Beds, Surgeons, Ventilators, etc.) are modeled as **autonomous agents** that negotiate resource allocation for incoming patients through a structured bidding protocol:

1. **ANNOUNCEMENT** — Manager agent broadcasts a Call For Proposals (CFP) for the highest-priority patient
2. **BIDDING** — Available resource agents compute bid scores using a 6-factor weighted formula
3. **EVALUATION** — Bids are ranked with urgency multipliers (P1 = 2× boost)
4. **DEPENDENCY CHECK** — Validates that all mandatory co-resources (e.g., OR needs Surgeon + Anesthesiologist) are satisfied
5. **AWARD** — Best-fit resources are allocated; all decisions include a full reasoning trail and SHA-256 audit hash

### Key Features
- **Real-time negotiation visualization** — animated @xyflow/react bid graph showing agents and bid edges live
- **MEWS/ESI triage scoring** — clinical triage computed from patient vitals
- **Explainable AI** — every decision includes weighted reasoning factors and natural language summary
- **Cryptographic audit log** — SHA-256 hashed decisions, exportable as JSON/CSV
- **Supabase persistence** — decisions and audit entries persisted in real-time
- **Role-based auth** — admin (full control) and viewer (read-only) via Supabase Auth
- **Security hardened** — CSP headers, HSTS, X-Frame-Options, rate-limiting ready

---

## Setup Instructions

### Prerequisites
- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd hospital-negotiation
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `src/lib/supabase/schema.sql`
3. Go to **Authentication → Users** and create two users:
   - `admin@hospital.demo` / `HospitalAdmin@2026` → then set role to `admin` in profiles table
   - `viewer@hospital.demo` / `HospitalView@2026`

### 3. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Find these in: Supabase Dashboard → Settings → API

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

---

## Application Pages

| Route | Description |
|-------|-------------|
| `/dashboard` | KPIs, resource status grid, active negotiation panel |
| `/negotiation` | Live animated bid graph (Contract Net Protocol), round history, explainability panel |
| `/patients` | Triage-sorted patient queue (P1 rows pulse red), admit new patients |
| `/resources` | Resource agents with state machines, capability tags, utilization sparklines |
| `/decisions` | Paginated audit table with collapsible reasoning trees, export JSON/CSV |
| `/analytics` | Utilization trends, negotiation outcome charts, decision latency distribution |

---

## Deploy to Vercel

```bash
npm run build  # verify build passes
```

Then push to GitHub and connect the repo to Vercel. Set the same environment variables in Vercel's project settings.

---

## Architecture

```
Browser (Zustand simulation engine)
│  setInterval(tick, 4000ms)
│  ↓
│  1. Process discharges
│  2. Random patient arrival (30% probability/tick)
│  3. Pick highest-triage WAITING patient
│  4. Run ContractNetProtocol in memory
│     ├── Compute bid scores for all matching resources
│     ├── Select winners per resource type (no duplicates)
│     └── Build reasoning factors + SHA-256 audit hash
│  5. Update Zustand state → React components re-render
│  6. Persist decision + audit entry → Supabase (non-blocking)
└  7. Supabase Realtime → other clients receive updates
```

### Bid Score Formula
```
score = (availability×0.35 + capability×0.30 + proximity×0.10 + specialty×0.15 + utilization×0.10) × urgencyMultiplier

urgencyMultiplier: P1=2.0, P2=1.5, P3=1.0, P4=0.7, P5=0.4
```

### Security Measures
- Content Security Policy (CSP) headers
- HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff
- Supabase Row Level Security (RLS) on all tables
- Role-based access: admin vs viewer
- SHA-256 audit hashes on all decisions
- No eval(), no raw DB queries, all inputs type-validated

---

## Known Limitations
- Simulation state is in-memory (resets on page refresh) — decisions/audit persist to Supabase
- Designed for demo/hackathon; production use would require a persistent simulation coordinator service
- No PHI stored — all patient data is synthetic/anonymized

---

## Tech Stack
Next.js 16 · TypeScript · Tailwind CSS v4 · Zustand · Supabase · @xyflow/react · Recharts · framer-motion · Lucide React
