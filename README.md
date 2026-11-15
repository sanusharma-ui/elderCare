# स्मृति • Smriti
### Elderly Care & Medication Management Platform — Stage 1 & Stage 2 (Smart Backend & Automation)

[![Next.js](https://img.shields.io/badge/Next.js-15.1.7-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19.3-2D3748?logo=prisma)](https://www.prisma.io/)
[![Google GenAI](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8E75B2?logo=google)](https://aistudio.google.com/)
[![Nodemailer](https://img.shields.io/badge/Nodemailer-SMTP-22b8cf)](https://nodemailer.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🌟 Overview

**Smriti** is an intelligent, multi-generational elderly care and medication adherence platform designed for Indian families, caretakers, and doctors. It combats medication non-adherence among senior citizens through a shared care ecosystem, single-use passcode access, multilingual support (Hindi, Marathi, English), proactive multi-level escalation alerts, and AI-assisted clinical briefings.

### Stage 1 (Foundation):
- Production-grade **Data Layer** and **Route Handlers** (`src/app/api/...`) on Next.js 15 App Router.
- Dual-mode authentication via **Supabase Auth** (supporting both browser session cookies and Postman `Authorization: Bearer <token>`).
- Strict Role-Based Access Control (**DOCTOR**, **ELDER**, **CARETAKER**, **FAMILY**).
- Zero-trust elder permissions, single-use passcode invites (`K7QD-9M2X`), and IDOR protection.
- Row-Level Security (RLS) hardening blocking direct PostgREST client queries.

### Stage 2 (The Smart Backend):
- **Dose Tracking & Undo**: Multi-role marking (`TAKEN` by elder, `GIVEN` by caretaker, `SKIPPED`), ±window validation, stock auto-decrement, 10-minute undo grace window, and late-taken alerts.
- **Automated Cron Engine**: Idempotent background runners (`/api/cron/tick` every 1 min, `/api/cron/daily` at 07:00 IST) secured by constant-time `CRON_SECRET` tokens.
- **Proactive Multi-Level Escalation Timeline**:
  - `Level 0` (Materialized PENDING doses in elder's local timezone)
  - `Level 1` ($T$: Due reminder to elder and active caretakers)
  - `Level 2` ($T + \text{grace}/2$: Firm nudge reminder)
  - `Level 3` ($T + \text{grace}$: Mark MISSED; escalate to family members and flag doctor)
  - Stale Cleanup ($T + 6\text{h}$: Silently marks abandoned doses MISSED without spamming family)
- **Care Circle Notifications & Email Engine**: Multilingual localized messages (`en`, `hi`, `mr`), automatic deduplication, phone-only protection (`hasRealEmail = false` skips SMTP), and queued outbox processor with time-budgeting.
- **Caretaker Clinical Notes**: Observation logging with `URGENT` flags instantly emailing linked doctors, plus doctor acknowledgement (`PATCH /api/notes/:id/seen`).
- **Pure SQL/Prisma Adherence Analytics**: Deterministic 7/14/30-day adherence rates, slot analysis, miss streaks, and doctor dashboard risk ranking without AI hallucination.
- **Google Gemini AI Assistant (`@google/genai`)**:
  - Daily Clinical Briefing digest with deterministic fallback.
  - On-demand 7-day Patient Clinical Summary cached in `AiPatientSummary`.
  - Multimodal Prescription Scanner extracting structured medicine drafts.
  - Natural Language Doctor Q&A (`POST /api/doctor/ask`) with tool function calling strictly scoped to patient data.
  - Mandatory clinical safety disclaimers, rate limiting (20 req/hr/doctor), and timeout/retry resiliency.

---

## 🏗️ Architecture & Component Flow

```
                      ┌──────────────────────────────────────────────┐
                      │          Clients (Postman / Web App)         │
                      └──────────────────────┬───────────────────────┘
                                             │
                              Bearer Token OR Session Cookies
                                             │
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │           Next.js 15 Route Handlers          │
                      │          (requireAuth & getElderAccess)       │
                      └──────┬────────────────┬───────────────┬──────┘
                             │                │               │
                             ▼                ▼               ▼
                      ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
                      │   Supabase   │ │  Prisma ORM  │ │ Google GenAI │
                      │  Auth Admin  │ │ (PostgreSQL) │ │ (Gemini 2.5) │
                      └──────────────┘ └──────┬───────┘ └──────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      │                                               │
                      ▼                                               ▼
         ┌─────────────────────────┐                     ┌─────────────────────────┐
         │ cron-job.org Scheduler  │                     │   Nodemailer Service    │
         │ (POST /api/cron/tick)   │                     │   (Gmail App Password)  │
         │ (POST /api/cron/daily)  │                     │   Responsive HTML Alert │
         └─────────────────────────┘                     └─────────────────────────┘
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

| Variable | Description | Example / Instructions |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Public Anon Key | From Supabase Project Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret Admin Service Role Key | Server-only; never expose to browser |
| `DATABASE_URL` | Pooled connection string (port 6543) | `postgresql://postgres.[ref]:[pass]@aws-0-...pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | Direct connection string (port 5432) | `postgresql://postgres.[ref]:[pass]@aws-0-...pooler.supabase.com:5432/postgres` |
| `CRON_SECRET` | Secret token guarding cron endpoints | 32+ character random hex string (`openssl rand -hex 24`) |
| `SMTP_HOST` | Outgoing SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `465` (SSL) or `587` (TLS) |
| `SMTP_SECURE` | Use SSL/TLS | `true` (for port 465) |
| `SMTP_USER` | SMTP login account | Your Gmail address (e.g. `alerts@smriti.app` or personal) |
| `SMTP_PASS` | Gmail App Password (16 chars) | Generated from Google Account Security |
| `SMTP_FROM` | Outgoing sender display | `Smriti Elderly Care <no-reply@smriti.app>` |
| `GEMINI_API_KEY` | Google Gemini API Key | Obtained from Google AI Studio |
| `GEMINI_MODEL` | Gemini AI model identifier | `gemini-2.5-flash` |

---

## 🔑 External Services Setup Guide

### 1. Gmail App Password Setup (for SMTP Email Alerts)
1. Navigate to your [Google Account Security Settings](https://myaccount.google.com/security).
2. Under "How you sign in to Google", ensure **2-Step Verification** is enabled.
3. Search for **App passwords** or go directly to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
4. Enter an App Name (e.g., `Smriti App`) and click **Create**.
5. Copy the generated 16-character password (e.g., `abcd efgh ijkl mnop`).
6. Paste it into `.env` as `SMTP_PASS` (spaces may be removed or kept). Set `SMTP_USER` to your Gmail address.

### 2. Google Gemini API Key Setup
1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account and click **Get API key** -> **Create API key in new project**.
3. Copy your API key into `.env` as `GEMINI_API_KEY`.
4. The system uses `gemini-2.5-flash` by default with fallback to deterministic algorithmic summaries if the key is missing or quota is exhausted.

### 3. cron-job.org External Scheduler Setup
Since Smriti deploys to serverless environments (Vercel) without persistent background processes, scheduled tasks are driven by external webhooks:
1. Create a free account at [cron-job.org](https://cron-job.org/).
2. **Job 1: Minute Tick Engine**
   - **URL:** `https://your-domain.vercel.app/api/cron/tick`
   - **Method:** `POST` (or `GET`)
   - **Schedule:** Every 1 minute (`* * * * *`)
   - **Headers:** `Authorization: Bearer <YOUR_CRON_SECRET>`
   - *Actions performed:* Dose materialization, stale cleanup, due/nudge/missed escalation, pattern alerts, appointment reminders, refill reminders, and email outbox dispatch.
3. **Job 2: Daily Clinical Briefing Engine**
   - **URL:** `https://your-domain.vercel.app/api/cron/daily`
   - **Method:** `POST` (or `GET`)
   - **Schedule:** Every day at `07:00 AM IST` (`01:30 UTC` -> cron expression `30 1 * * *`)
   - **Headers:** `Authorization: Bearer <YOUR_CRON_SECRET>`
   - *Actions performed:* Generates localized `AiBrief` entries for all active doctors with linked elders.

---

## 🚀 Installation & Local Development

```bash
# 1. Install dependencies
npm install

# 2. Push Prisma schema to Supabase
npx prisma db push

# 3. Apply Row Level Security (RLS) hardening
# Run prisma/enable_rls.sql via Supabase SQL Editor or psql:
# psql "$DIRECT_URL" -f prisma/enable_rls.sql

# 4. Seed the database with comprehensive Stage 1 & Stage 2 demo data
npm run db:seed

# 5. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) or check [http://localhost:3000/api/health](http://localhost:3000/api/health).

---

## 🧪 Comprehensive Testing & Smoke Suites

### Automated Stage 2 Time-Travel Smoke Test
Run the comprehensive Stage 2 end-to-end integration test suite:
```bash
npm run test:smoke:stage2
```
This tests 16 sequential scenarios using simulated time-travel (`?now=<ISO>`):
1. Health check & clean database state
2. Doctor login & baseline dashboard verification
3. Caretaker & Elder login
4. Materialization via `/api/cron/tick` (creates PENDING doses)
5. `Level 1` Escalation: Scheduled time reached -> `UPCOMING_DOSE` in-app notification
6. `Level 2` Escalation: Half-grace elapsed -> Firm nudge notification
7. `Level 3` Escalation: Full grace elapsed -> `MISSED_DOSE` alert sent to family & doctor
8. Pattern Alert: 3-day consecutive miss streak creates urgent notification
9. Caretaker logs `URGENT` clinical note -> doctor receives in-app & email notification
10. Doctor views notes and marks urgent note as seen (`PATCH /api/notes/:id/seen`)
11. Elder marks dose `TAKEN` (stock auto-decrements)
12. 10-minute undo window test (`POST /api/doses/:id/undo` restores stock)
13. Caretaker marks dose `GIVEN` with note
14. Pure SQL adherence analytics verification (`GET /api/elders/:elderId/adherence`)
15. Doctor alerts feed filters critical patients (`GET /api/doctor/alerts`)
16. AI Daily Briefing & Patient Summary (`GET /api/doctor/brief`, `GET /api/doctor/elders/:elderId/summary`)

### Stage 1 Baseline Smoke Test
```bash
npm run test:smoke
```

### REST Client Collection (`api.http`)
An all-inclusive `api.http` file is provided in the project root containing executable requests for all 43 API endpoints across 15 structured sections:
- Sections 1–9: Stage 1 Authentication, Invites, Elders, Medicines, Appointments, Audit Logs
- Section 10: Dose Tracking, History, and Undo
- Section 11: Caretaker Clinical Notes & Doctor Acknowledgement
- Section 12: Pure SQL Adherence Analytics & Doctor Dashboard
- Section 13: Care Circle In-App Notifications
- Section 14: Google Gemini AI Features (Briefings, Summaries, Vision Prescriptions, Q&A)
- Section 15: Cron Engine Webhooks with Time-Travel

---

## ⚡ Production Deployment (Vercel)

1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com/), import the repository.
3. Configure **Environment Variables** matching `.env`:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL` (pooled connection with `?pgbouncer=true&connection_limit=1`)
   - `DIRECT_URL` (direct connection)
   - `CRON_SECRET`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
   - `GEMINI_API_KEY`, `GEMINI_MODEL`
4. Deploy! The project includes `export const maxDuration = 60;` on all cron routes and handles outbox batching (25 emails/tick with a 40s execution budget) to ensure zero serverless timeouts.