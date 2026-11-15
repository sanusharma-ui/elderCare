# स्मृति • Smriti
### Elderly Care & Medication Management Platform — Stage 1 (Backend Foundation)

[![Next.js](https://img.shields.io/badge/Next.js-15.1.7-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19.3-2D3748?logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🌟 Overview

**Smriti** is an elderly care and medication adherence ecosystem designed for multi-generational Indian families, caretakers, and doctors. It solves the critical problem of medication non-adherence among senior citizens through a shared care circle, passcode-based secure family/caretaker access, localized medication names (Hindi/Marathi), and audit trails.

**Stage 1 Scope:**
- Production-grade **Backend Foundation**, **Data Layer**, and **Route Handlers** (`src/app/api/...`).
- Dual-mode authentication via **Supabase Auth** (supports both SSR session cookies and Postman `Authorization: Bearer <token>`).
- Strict Role-Based Access Control (**DOCTOR**, **ELDER**, **CARETAKER**, **FAMILY**).
- Center-of-control elder permissions and single-use passcode invites (`K7QD-9M2X`).
- Daily dose expansion in the elder's local timezone (`/api/elders/:elderId/today`).
- Comprehensive Row-Level Security (RLS) hardening blocking direct Supabase client access.
- Stage 2 placeholders for proactive email alerts, cron evaluation, and Gemini AI clinical briefing digests.

---

## 🏗️ Architecture & Security Design

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
                     └──────────────┬───────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌──────────────────────┐                          ┌──────────────────────┐
│  Supabase Auth Server│                          │    Prisma ORM        │
│  (Token Verification │                          │    (PostgreSQL)      │
│  & Admin Operations) │                          │                      │
└──────────────────────┘                          └──────────┬───────────┘
                                                             │
                                                             ▼
                                                  ┌──────────────────────┐
                                                  │ PostgreSQL (Supabase)│
                                                  │ * RLS Enabled on all │
                                                  │   tables (No Anon)   │
                                                  └──────────────────────┘
```

### 1. Zero-Trust Access Model
- **Elder is Center of Control:** Nobody (doctor, caretaker, or family) can read or modify an elder's profile, medicines, or schedule without an active `ElderAccess` link.
- **IDOR Protection:** If a user attempts to access an elder they are not linked to, the API returns **404 Not Found** (never 403), preventing attackers from enumerating valid elder UUIDs.
- **Role Isolation:**
  - `DOCTOR`: Prescribes, updates, and stops medications; schedules appointments; reviews clinical audit logs.
  - `ELDER`: Profile owner; generates invites; revokes members; views simple daily schedule. Cannot edit prescriptions.
  - `CARETAKER`: Read-only access to elder's daily schedule and medications. Can invite **FAMILY** members only.
  - `FAMILY`: Notification recipients only. Can view basic elder name only. **Zero medication or clinical access (403)**.
- **Role Authority:** Roles are read **exclusively** from our `public.users` table. Roles stored in Supabase `user_metadata` or `app_metadata` are never trusted.

### 2. Phone-Only Elder Authentication
Many elderly patients in India do not have active email addresses. To bypass paid SMS provider restrictions while keeping Supabase Auth:
- For phone-only elders, the backend generates a deterministic internal auth email: `p<normalizedPhone>@users.smriti.app` (e.g. `p919811122332@users.smriti.app`).
- The real contact email (`email`) is optional and nullable.
- Elders can log in using either their real email OR their phone number (`POST /api/auth/login { identifier, password }`).
- `authEmail` and `hasRealEmail` are strictly internal and never exposed in API responses.

### 3. Row Level Security (RLS) Hardening
> [!IMPORTANT]
> Supabase automatically exposes all tables in the `public` schema via its auto-generated PostgREST REST API. If RLS is disabled, anyone possessing your public `anon` key could query medication logs and elder profiles directly.
> 
> Smriti enforces **Row Level Security on all public tables with NO public policies**. This blocks all direct client access through PostgREST and ensures all database reads/writes happen strictly through our Next.js backend server connecting as the database owner.

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description | Where to find in Supabase |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | **Project Settings > API > Project URL** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Anon Key | **Project Settings > API > Project API Keys > `anon public`** |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret Admin Key | **Project Settings > API > Project API Keys > `service_role secret`** |
| `DATABASE_URL` | Transaction pooled connection (port 6543) | **Project Settings > Database > Connection string > URI (Mode: Transaction, port 6543)** |
| `DIRECT_URL` | Direct connection (port 5432) | **Project Settings > Database > Connection string > URI (Mode: Session, port 5432)** |
| `CRON_SECRET` | 32+ character random secret | Any secure random string (e.g. `openssl rand -hex 24`) |

> [!CAUTION]
> **CRITICAL SECURITY WARNING:**
> Never commit your `SUPABASE_SERVICE_ROLE_KEY` to source control. Never prefix it with `NEXT_PUBLIC_`. This key bypasses all Supabase Auth rate limits and Row Level Security. It is strictly used on the server in `src/lib/supabase/admin.ts`.

---

## 🚀 Step-by-Step Setup Guide

### 1. Create a Supabase Project
1. Log in to [Supabase](https://supabase.com/) and click **New project**.
2. Set your Project Name (e.g. `smriti-dev`), set a secure database password, and choose your preferred region (e.g. `ap-south-1` Mumbai).
3. Wait for the database to provision.

### 2. Configure Supabase Authentication (Crucial for Demo)
1. In your Supabase dashboard, navigate to **Authentication > Providers > Email**.
2. **Turn OFF "Confirm email"** (Toggle disabled).
   - *Why:* This allows the seed script and registration endpoints to provision active demo users immediately without getting blocked by SMTP rate limits.
3. Save your changes.

### 3. Copy Connection Strings & Keys
1. Go to **Project Settings > API**:
   - Copy `Project URL` to `NEXT_PUBLIC_SUPABASE_URL`.
   - Copy `anon public` key to `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - Copy `service_role secret` key to `SUPABASE_SERVICE_ROLE_KEY`.
2. Go to **Project Settings > Database**:
   - Scroll to **Connection string > URI**.
   - Select **Transaction (port 6543)**, append `&pgbouncer=true&connection_limit=1`, and paste into `DATABASE_URL`.
   - Select **Session (port 5432)** and paste into `DIRECT_URL`.

### 4. Install Dependencies & Push Schema
```bash
# 1. Install dependencies
npm install

# 2. Push Prisma schema to Supabase
npx prisma db push

# 3. Apply Row Level Security (RLS) hardening
# Option A: Run via Supabase SQL Editor using prisma/enable_rls.sql
# Option B: Run via psql using DIRECT_URL:
# psql "$DIRECT_URL" -f prisma/enable_rls.sql
```

### 5. Run the Idempotent Seed Script
```bash
npm run db:seed
```
This seeds:
- **1 Doctor:** Dr. Anjali Mehta (`dr.anjali@smriti.app` / `Password@123`)
- **8 Elders:** Realistic Indian profiles (mix of Hindi/Marathi; phone-only accounts; high & poor adherence profiles)
- **2 Caretakers:** Pooja Sawant & Rajesh Kumar
- **3 Family Members:** Amit Sharma, Priya Kulkarni, Vikram Deshmukh
- **Chronic Geriatric Medications:** Metformin, Amlodipine, Atorvastatin, Ecosprin, Thyronorm with Hindi/Marathi instructions and warnings.
- **7 Days of Historical Dose Logs:** Realistic adherence logs for doctor dashboard and AI briefings.
- **2 Fresh Unused Single-Use Passcodes:** e.g. `K7QD-9M2X`.

### 6. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the placeholder landing page, or hit [http://localhost:3000/api/health](http://localhost:3000/api/health) to confirm API health.

---

## 🧪 Testing with Postman & Thunder Client

### REST Client (`api.http`)
An `api.http` file is included in the project root. It is natively supported by:
- VS Code **REST Client** extension
- **Thunder Client**
- JetBrains HTTP Client

It includes requests for every endpoint, complete with sample JSON bodies, role testing, and variable definitions.

### Automated End-to-End Smoke Test
Run the comprehensive automated smoke test while your dev server is running:
```bash
npm run test:smoke
```
This executes a 16-step integration workflow:
1. System health check
2. Doctor authentication
3. Doctor creates elder account directly (receives temporary password)
4. Elder logs in with temporary password via phone
5. Caretaker & Family registration
6. Elder generates single-use passcode invite
7. Caretaker redeems invite code
8. Reusing redeemed invite code fails (`400 INVITE_ALREADY_USED`)
9. Doctor prescribes medicine with schedules
10. Caretaker reads `/today` in elder's timezone
11. Caretaker is rejected when editing medication (`403 FORBIDDEN`)
12. Family member is rejected when reading medications (`403 FORBIDDEN`)
13. IDOR protection: unlinked elder access returns `404 NOT_FOUND`
14. Elder revokes caretaker access
15. Revoked caretaker loses access immediately (`404 NOT_FOUND`)

---

## 🚢 Deploying to Vercel

1. Push your repository to GitHub / GitLab.
2. In the [Vercel Dashboard](https://vercel.com/), click **New Project** and import the repository.
3. In **Build and Output Settings**:
   - Framework Preset: **Next.js**
   - Build Command: `prisma generate && next build` (configured automatically in `package.json`).
4. In **Environment Variables**, add all keys from `.env`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL` (use the pooled connection URL with `?pgbouncer=true`)
   - `DIRECT_URL` (direct connection for migrations)
   - `CRON_SECRET`
5. Click **Deploy**. Vercel will generate the Prisma Client on postinstall and build the serverless API route handlers.
