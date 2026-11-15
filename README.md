# CareSaathi

### A mobile-first elder-care and medication-management platform for Indian families

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://www.prisma.io/)
[![PWA](https://img.shields.io/badge/PWA-Installable-1F5C4A?logo=pwa)](https://web.dev/progressive-web-apps/)

> **CareSaathi** brings elders, doctors, caretakers, and family members into one calm, shared care circle. It combines medication adherence tracking, proactive alerts, clinical workflows, multilingual accessibility, and AI-assisted doctor tooling in a fast, polished interface.

---

## Table of Contents

- [Why CareSaathi](#why-caresaathi)
- [What the platform provides](#what-the-platform-provides)
- [Four-role care circle](#four-role-care-circle)
- [Mobile-first and PWA experience](#mobile-first-and-pwa-experience)
- [Technical architecture](#technical-architecture)
- [Automation and AI](#automation-and-ai)
- [Security and rate limiting](#security-and-rate-limiting)
- [Performance and UX](#performance-and-ux)
- [Getting started](#getting-started)
- [Available scripts](#available-scripts)
- [Demo flow](#demo-flow)
- [Production checklist](#production-checklist)
- [License](#license)

---

## Why CareSaathi

Many families coordinate elder care over phone calls and chat messages. That makes it difficult to answer simple but important questions:

- Was the morning medicine taken?
- Which doses were missed?
- Does the doctor need to see a caretaker's observation?
- Is medicine stock running low?
- How can a family member help when they do not have a laptop?

CareSaathi solves this with a shared, time-based medication diary and role-specific experiences.

### Designed for real-world constraints

- **Not everyone has a PC:** elders, domestic caretakers, and family members can use the mobile-first interface from a phone.
- **Web apps can feel unstable on mobile:** the production build can be installed as a standalone PWA with an app icon, splash experience, responsive layout, and offline fallback page.
- **Elders need clarity, not dashboard overload:** large touch targets, simple daily schedules, high-contrast status states, voice reminders, and calm visual hierarchy keep the primary action obvious.
- **Families need signal, not notification spam:** escalation is focused on missed doses, urgent notes, and clinically relevant events.
- **Doctors need structured information:** adherence summaries, risk indicators, prescription scanning, audit history, and patient-scoped clinical Q&A reduce manual review time.

---

## What the platform provides

### Medication adherence

- Daily schedules grouped into morning, afternoon, evening, and night.
- Dose states: `PENDING`, `TAKEN`, `GIVEN`, `MISSED`, and `SKIPPED`.
- Elder confirmation and caretaker confirmation are tracked separately.
- A 10-minute undo window helps recover from accidental taps.
- Medicine stock counts and refill thresholds are tracked.
- Food relation, dosage, timing, instructions, and warnings are shown with every medicine.

### Care coordination

- Single-use invite passcodes connect members to an elder.
- Doctors, caretakers, and family members receive role-scoped access.
- Caretakers can switch between multiple elders.
- Caretakers can create clinical observation notes with `INFO`, `WARNING`, or `URGENT` severity.
- Family members get an alert stream and a one-tap call prompt when an escalation needs attention.

### Doctor workflow

- Clinical ledger and patient directory.
- Patient risk stratification based on adherence signals.
- Daily AI clinical brief with cached results.
- Prescription image scanning with Google Gemini Vision.
- Appointment scheduling and reminder support.
- Audit timeline for important clinical changes.
- Patient-scoped natural-language assistant with server-side data access controls.

### Language and accessibility

- English, Hindi, and Marathi message catalogs.
- Language selection updates the UI immediately and persists through the `NEXT_LOCALE` cookie.
- User language preference is synchronized with the account when available.
- Elder-friendly large-text mode.
- Browser speech synthesis for schedule reading in English, Hindi, and Marathi.
- Responsive layouts for phone, tablet, and desktop testing.

---

## Four-role care circle

| Role | Primary experience | Main capabilities |
|---|---|---|
| **Elder** | Installable mobile PWA | View today's medicines, listen to schedule, mark doses as taken, manage care-circle access |
| **Caretaker** | Mobile-first care console | Switch elders, mark doses as given or skipped, write observations, monitor stock |
| **Family member** | Mobile-first alert stream | Link elders, receive missed-dose alerts, review recent notifications, call the elder |
| **Doctor** | Desktop clinical console | Review patients, risk signals, AI briefs, prescriptions, appointments, audit history, and clinical Q&A |

Access is enforced on the server. A user's role is read from the application database, and elder-specific access is checked through active care-circle relationships.

---

## Mobile-first and PWA experience

CareSaathi is already structured to behave like a mobile app without forcing every user to own a computer.

### What works today

- Installable PWA manifest with standalone display mode.
- Production-only service-worker registration.
- Responsive phone frame and wide-fluid desktop testing modes.
- Static assets and fonts use cache-first behavior.
- Navigation uses network-first behavior with an offline fallback page.
- API requests and mutation requests are deliberately **network-only** so medical data is never served stale from a cache.
- Large touch targets, haptic feedback where supported, and speech reminders improve phone usability.

### Why a mobile app conversion is valuable

The current PWA is the fastest path for distribution: users can open the web URL and install it from a supported browser. If a store-distributed application is required later, the same frontend can be packaged with:

- **Capacitor** for Android/iOS builds and native plugins.
- **Trusted Web Activity** for an Android Play Store wrapper.
- A future native shell for push notifications, background sync, deep links, and device integrations.

This approach avoids maintaining a separate Android and iOS codebase while preserving the existing responsive UI and API contracts.

### Important offline design decision

The offline layer caches the shell and static assets, not medication or clinical API responses. This is intentional: stale health information must never be presented as current. Users see a clear offline state and can continue once connectivity returns.

---

## Technical architecture

### Frontend

- **Next.js 15** App Router with React 19.
- TypeScript with strict project settings.
- Tailwind CSS with a custom healthcare visual system.
- Framer Motion reveal animations.
- TanStack React Query for client-side server-state caching and invalidation.
- `next-intl` message catalogs for English, Hindi, and Marathi.
- Lucide icons, Mukta, Fraunces, and Noto Serif Devanagari typography.

### Backend

- Next.js Route Handlers under `src/app/api`.
- Supabase Auth for browser sessions and token verification.
- PostgreSQL on Supabase.
- Prisma ORM for typed database access.
- Server-side role and elder-access checks.
- Nodemailer SMTP integration for urgent email notifications.
- Google GenAI SDK for Gemini-powered clinical tooling.

### Data model

The Prisma schema includes entities for:

- Users and role-specific profiles.
- Elder access relationships and invite codes.
- Medicines and schedules.
- Dose logs and adherence calculations.
- Appointments.
- Caretaker notes.
- Notifications.
- AI briefs and patient summaries.
- Audit logs.

Row-Level Security SQL is included under `prisma/` and `supabase/migrations/`.

---

## Automation and AI

### Minute scheduler: `/api/cron/tick`

An external scheduler can call this endpoint every minute:

1. Materializes scheduled dose logs in the elder's timezone.
2. Evaluates grace periods.
3. Sends reminders to the appropriate care-circle role.
4. Marks expired doses as missed.
5. Creates family escalation notifications and email outbox events.
6. Decrements medicine inventory when a dose is confirmed.
7. Creates appointment reminders at T-24 hours and T-2 hours.

### Daily brief scheduler: `/api/cron/daily`

Generates or refreshes daily doctor briefs, with cached AI results stored in the database to reduce repeated model calls and improve response speed.

### Clinical AI

- **Daily clinical brief:** turns adherence metrics into a concise, actionable summary.
- **Prescription scanner:** extracts medicine name, dosage, frequency, form, food relation, and instructions from a prescription image for doctor review.
- **Ask CareSaathi:** answers questions only from the linked patient's scoped clinical data.
- **Fallback summaries:** deterministic summaries remain available when the AI service is unavailable.

AI output is an assistant for review; doctors remain responsible for clinical decisions.

---

## Security and rate limiting

### Request protection

The middleware applies security headers including:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`
- HSTS in production

Mutating API requests perform origin/host checks for CSRF protection. Cron routes use bearer-token authentication and are excluded from browser-origin checks.

### Authentication and authorization

- Supabase sessions are verified cryptographically.
- Bearer tokens are supported for API clients and testing tools.
- Role checks are enforced server-side.
- Elder access is checked through active care-circle links.
- Authenticated user sessions use a short-lived 15-second in-memory cache to avoid redundant auth round trips during rapid navigation.
- Sensitive internal fields are removed before user data is returned to clients.

### Rate-limit presets

| Operation | Limit |
|---|---:|
| Login | 5 requests / minute / IP and target |
| Registration | 5 requests / 10 minutes / IP |
| Invite redemption | 10 requests / 5 minutes / IP |
| Invite creation | 5 requests / 10 minutes / elder |
| Gemini AI calls | 20 requests / hour / user |
| Prescription scans | 6 scans / 10 minutes |
| Sensitive writes | 10 requests / minute |
| Standard writes | 60 requests / minute |
| General API | 120 requests / minute / IP |

Rate-limited responses return HTTP `429`, `Retry-After`, and `X-RateLimit-*` headers. The current implementation uses an in-memory fixed-window store, which is excellent for a single instance and local development. A distributed store such as Redis should be used before running multiple production instances.


---

## Performance and UX

CareSaathi is designed to feel fast even on modest mobile devices:

- Optimistic dose updates make the primary action feel instant.
- React Query keeps frequently used server data warm and avoids unnecessary refetching.
- Auth validation has a short-lived server cache for rapid page transitions.
- Static Next.js assets and fonts are cached by the service worker.
- Production builds use Next.js optimization and route-level code splitting.
- UI feedback uses lightweight toast notifications instead of blocking dialogs for normal actions.
- The visual system uses spacious cards, clear status colors, large controls, and subtle motion rather than dense enterprise tables on mobile.

The result is a clean, modern interface that is easy to understand at a glance while still giving doctors the data density they need.

---

## Getting started

### Prerequisites

- Node.js 18.18+ or 20+
- npm
- Supabase project with PostgreSQL
- Google Gemini API key for AI features
- SMTP credentials for email alerts (optional during basic development)

### 1. Install

```powershell
cd D:\Projects\smriti
npm install
```

### 2. Configure environment variables

```powershell
Copy-Item .env.example .env
```

Fill in the values in `.env`. At minimum, configure Supabase and PostgreSQL values. Keep `.env` local and never force-add it to git.

### 3. Generate Prisma client and prepare the database

```powershell
npm run db:generate
npm run db:push
```

For local/demo data:

```powershell
npm run db:seed
```

### 4. Start development

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Run the production build

```powershell
npm run build
npm run start
```

PWA installation and service-worker behavior should be tested against the production build, not only `next dev`.

---

## Available scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Generate Prisma client and build the production app |
| `npm run start` | Start the production server |
| `npm run lint` | Run the configured Next.js lint command |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:push` | Push the Prisma schema to the database |
| `npm run db:migrate` | Create/apply a Prisma development migration |
| `npm run db:seed` | Seed demo users, medicines, schedules, and history |
| `npm run db:studio` | Open Prisma Studio |
| `npm run test:smoke` | Run the main smoke test |
| `npm run test:smoke:stage2` | Run the Stage 2 smoke test |

---

## Demo flow

1. Open the login page and use one of the configured demo account buttons.
2. Open the doctor dashboard and review the clinical brief, patient list, and risk indicators.
3. Open an elder account and test the daily schedule, language switcher, voice reminder, and large dose action.
4. Open a caretaker account and test elder switching, dose marking, inventory warnings, and urgent notes.
5. Open a family account and review missed-dose alerts and the call prompt.
6. Test the cron endpoint with a valid local `CRON_SECRET`:

```powershell
curl.exe -X POST "http://localhost:3000/api/cron/tick?now=2026-11-15T10:00:00Z" `
  -H "Authorization: Bearer your_local_cron_secret"
```

Demo credentials are created by the seed script. Treat them as local-only demo data and change or disable them before any shared or production deployment.

---

## Production checklist

- [ ] Replace every placeholder in `.env.example`.
- [ ] Rotate any service-role, database, SMTP, Gemini, or cron secret that has been exposed.
- [ ] Use strong random secrets, especially `CRON_SECRET`.
- [ ] Disable or replace fixed demo credentials.
- [ ] Run database migrations and verify RLS policies.
- [ ] Use a distributed rate-limit store when deploying multiple instances.
- [ ] Configure a trusted external scheduler for the cron endpoints.
- [ ] Configure SMTP sender and delivery monitoring.
- [ ] Build and test the PWA over HTTPS.
- [ ] Run Lighthouse and test on low-end Android hardware.
- [ ] Verify that offline mode never displays stale clinical API data.

---

## License

The repository does not currently include a license file. Add the intended license before public distribution.
