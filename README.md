# CareSaathi (केयर साथी)
### Multi-Generational Elderly Care & Proactive Medication Management Ecosystem

[![Next.js](https://img.shields.io/badge/Next.js-15.1.7-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19.3-2D3748?logo=prisma)](https://www.prisma.io/)
[![Google GenAI](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8E75B2?logo=google)](https://aistudio.google.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12.4.7-0055FF?logo=framer)](https://www.framer.com/motion/)
[![PWA](https://img.shields.io/badge/PWA-Installable-1F5C4A?logo=pwa)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📖 Executive Summary

**CareSaathi (केयर साथी)** is an intelligent healthcare platform tailored specifically for Indian families, geriatric doctors, and domestic caretakers. It addresses the critical healthcare challenge of elderly medication non-adherence by uniting all stakeholders on a single, synchronized daily schedule with vernacular language accessibility, proactive multi-tier escalation, and clinical AI oversight.

### The Problem It Solves:
1. **Memory & Cognitive Decline:** Seniors frequently forget whether they took their morning or evening pills, leading to accidental double-dosing or missed life-saving medications.
2. **Language & Tech Friction:** Most existing health apps are English-only and feature cluttered, confusing dashboards that intimidate seniors.
3. **Fragmented Communication:** Family members living in another city or abroad have no visibility into daily care routines until a medical emergency occurs.
4. **Physician Information Overload:** Geriatricians lack a consolidated adherence ledger and must rely on verbal memory during brief 10-minute clinic consultations.

---

## 🏛️ Platform Architecture & 4-Role Care Circle

CareSaathi partitions functionality across four distinct, dedicated roles connected via single-use 6-digit invitation passcodes:

```
                      ┌────────────────────────┐
                      │      CARESATHI         │
                      │    CENTRAL ENGINE      │
                      └───────────┬────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         │                        │                        │
         ▼                        ▼                        ▼
 ┌───────────────┐        ┌───────────────┐        ┌───────────────┐
 │     ELDER     │        │    DOCTOR     │        │   CARETAKER   │
 │  (Senior PWA) │        │ (Web Console) │        │ (Mobile Care) │
 └───────┬───────┘        └───────────────┘        └───────────────┘
         │
         ▼
 ┌───────────────┐
 │    FAMILY     │
 │ (Alert Stream)│
 └───────────────┘
```

| Role | Form Factor | Key Capabilities |
| :--- | :--- | :--- |
| **ELDER (Senior)** | Mobile-First PWA | • Simple daily diary grouped by time-of-day slots (सुबह, दोपहर, शाम, रात)<br/>• Touch targets ≥ 56px with haptic feedback<br/>• Vernacular speech synthesis ("सुनो") in Hindi, Marathi & English<br/>• 10-minute instant undo window for accidental taps<br/>• Zero complex passwords (passcode-based circle linking) |
| **DOCTOR (Geriatrician)** | Desktop Web Console | • Split-view clinical ledger with patient risk stratification<br/>• AI-powered 7-day adherence briefings (Google Gemini 2.5 Flash)<br/>• Vision-based prescription scanner (`gemini-2.5-flash` vision)<br/>• Natural language clinical Q&A tool with strict physician data scoping<br/>• Prescription & appointment scheduling |
| **CARETAKER** | Mobile-First PWA | • Multi-elder patient switcher<br/>• Mark doses as GIVEN or SKIPPED with observation notes<br/>• Observation notes with URGENT severity triggers<br/>• Medicine inventory refill warnings |
| **FAMILY MEMBER** | Mobile-First PWA | • Zero notification spam: receives high-priority alerts ONLY when doses are missed<br/>• Immediate escalation details with 1-tap call elder button<br/>• Link to multiple elderly parents using single-use passcodes |

---

## 🤖 AI & Automation Engines

### 1. Minute Cron Scheduler (`/api/cron/tick`)
Called every 60 seconds by an external scheduler (cron-job.org or Vercel Cron):
- **Materialization:** Automatically generates scheduled dose logs in elder-specific timezones (`Asia/Kolkata`).
- **Grace Period & Escalation Engine:**
  - `Level 0`: Pending (within scheduled window).
  - `Level 1`: In-app reminder dispatched to elder.
  - `Level 2`: Notification dispatched to caretaker.
  - `Level 3`: Marked as `MISSED` — Urgent email and in-app alerts dispatched to all linked family members.
- **Inventory Auto-Decrement:** Real-time stock counts decrease upon dose confirmation; automatically alerts when stock hits the refill threshold.
- **Appointment Reminders:** Dispatches proactive notifications at T-24h and T-2h before scheduled doctor appointments.

### 2. Clinical AI Assistant (Google Gemini 2.5 Flash)
- **Daily Doctor Brief:** Summarizes the entire patient ledger into an actionable 3-bullet priority briefing in the doctor's preferred language.
- **Vision Prescription Digitizer:** Doctors photograph handwritten prescriptions; Gemini Vision extracts medication name, dosage, frequency, and instructions into a structured draft for doctor review.
- **Natural Language Assistant ("Ask CareSaathi"):** Answers doctor questions about linked patients using scoped, tamper-proof database tools.

---

## 👥 Seeded Demo Accounts

The database comes pre-seeded with realistic Indian patient profiles, medication schedules, and historical dose logs:

| Role | Name | Email / Phone | Password | Profile Details |
| :--- | :--- | :--- | :--- | :--- |
| **DOCTOR** | Dr. Anjali Mehta | `dr.anjali@caresaathi.app` | `Password@123` | Senior Physician managing all seeded patients |
| **ELDER** | Ramesh Sharma | `+919811122332` | `Password@123` | High adherence profile (Metformin, Amlodipine) |
| **ELDER** | Suresh Kulkarni | `+919822012345` | `Password@123` | Poor adherence profile (demonstrates doctor alert triggers) |
| **CARETAKER** | Pooja Sawant | `pooja.sawant@care.in` | `Password@123` | Linked to Ramesh Sharma & Suresh Kulkarni |
| **FAMILY** | Amit Sharma | `amit.sharma@family.com` | `Password@123` | Son of Ramesh Sharma; receives missed-dose alerts |

---

## 🛠️ Technology Stack

- **Framework:** Next.js 15.1.7 (React 19, App Router, Server Components)
- **Language:** TypeScript 5.7.3 (Strict Mode)
- **Styling:** Tailwind CSS with custom Indian healthcare palette (`forest`, `saffron`, `ok`, `brick`, `paper`)
- **Animations:** Framer Motion (`Reveal` component with staggered viewport-aware ease-out)
- **Database & Auth:** Supabase Auth (Cookie-based sessions) + PostgreSQL with Row-Level Security (RLS)
- **ORM:** Prisma ORM 6.19.3
- **Client Cache:** TanStack React Query v5
- **Artificial Intelligence:** Google GenAI SDK (`@google/genai`) — Gemini 2.5 Flash
- **Email:** Nodemailer (SMTP over TLS)
- **Typography:** Mukta, Fraunces, Noto Serif Devanagari

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.18+ or 20+
- PostgreSQL database (Supabase project recommended)
- Google Gemini API Key

### 1. Clone & Install
```bash
git clone https://github.com/your-username/caresaathi.git
cd caresaathi
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."

# Google Gemini AI
GEMINI_API_KEY="AIzaSy..."
GEMINI_MODEL="gemini-2.5-flash"

# Cron Security Secret
CRON_SECRET="your_secret_cron_token"

# Email Configuration (Nodemailer SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="alerts@caresaathi.app"
SMTP_PASS="your_gmail_app_password"
SMTP_FROM="CareSaathi Elder Care <alerts@caresaathi.app>"

# App Settings
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_DEMO_MODE="true"
```

### 3. Database Migration & Seeding
```bash
# Push schema to PostgreSQL
npm run db:push

# Run idempotent seed script
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📱 Progressive Web App (PWA) Verification

CareSaathi is built as an installable PWA with offline caching and native app behavior:

1. **Production Build:**
   ```bash
   npm run build
   npm run start
   ```
2. **Mobile Emulation:** Open Chrome DevTools (`F12`), toggle Device Toolbar (`Ctrl+Shift+M`), select **Pixel 7** or **iPhone 14** (390–430px).
3. **PWA Audit:** Run a Lighthouse audit under **Progressive Web App** to verify manifest validity, offline fallback, and install prompts.
4. **Desktop Shell Simulation:** When testing on wide monitors, `MobileShell` automatically centers the phone view inside a 430px column with a switch for fluid view.

---

## ⏱️ 3-Minute Demonstration Script

1. **Doctor Console:**
   - Sign in as `dr.anjali@caresaathi.app` (or click Doctor demo button).
   - Review the **AI Clinical Brief** at the top of the dashboard.
   - Click **Patients Directory** -> select **Suresh Kulkarni**.
   - Navigate to **AI Prescription Scan** tab -> upload sample prescription image to extract medicines.
2. **Elder Mobile Diary:**
   - Sign in as `+919811122332` (Ramesh Sharma).
   - Switch language to **हिन्दी** or **मराठी**.
   - Tap **"सुनो"** to trigger speech synthesis reading today's schedule aloud.
   - Tap the large 56px **"मैंने ले ली"** button -> verify instant green status update and 10-minute undo toast.
3. **Simulated Missed Dose:**
   - Trigger the cron webhook advancing time past a grace period:
     ```bash
     curl -X POST "http://localhost:3000/api/cron/tick?now=2026-11-15T10:00:00Z" \
       -H "Authorization: Bearer your_secret_cron_token"
     ```
4. **Family Missed Dose Alert:**
   - Sign in as `amit.sharma@family.com` (Family).
   - View the urgent **MISSED DOSE** alert with immediate call prompt.
5. **Caretaker Note & Doctor Sync:**
   - Sign in as `pooja.sawant@care.in` (Caretaker).
   - Write an **URGENT** clinical observation note.
   - Return to Doctor console to see unread note counter and ask the AI assistant: *"Did Suresh miss any doses this week?"*

---

## 🔒 Security & Privacy

- **Row Level Security (RLS):** All database tables have RLS enabled.
- **Service Role Isolation:** The Supabase service-role key is never exposed to the client.
- **Constant-Time Verification:** Cron endpoints compare bearer secrets with `crypto.timingSafeEqual` to prevent timing attacks.
- **Audit Logging:** Every critical clinical modification is immutably recorded in the `AuditLog` table.

---

## 📄 License

CareSaathi is open-source software licensed under the [MIT License](LICENSE).
