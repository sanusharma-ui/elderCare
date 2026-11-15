# SMRITI PLATFORM — STAGE 2 SMART BACKEND & AUTOMATION SUMMARY

This document summarizes the complete Stage 2 backend architecture, schema extensions, API endpoints, permission matrix additions, notification and escalation timeline, cron engine design, and AI integration for the **Smriti** Elderly Care & Medication Management Platform.

---

## 1. Schema Extensions & Migrations

### A. Additions to `Notification`
To support reliable email delivery, deduplication, and retry logic:
- `emailRequested`: `Boolean @default(false)` — Flag indicating whether an email dispatch was requested.
- `emailAttempts`: `Int @default(0)` — Counter of dispatch attempts.
- `emailError`: `String?` — Error message if dispatch failed.
- `dedupeKey`: `String?` — Deterministic unique deduplication key (e.g. `due:scheduleId:dateStr`, `missed:elderId:slot:dateStr`, `streak:elderId:dateStr`).
- `@@unique([userId, dedupeKey])` — Database-level idempotency constraint preventing duplicate notifications per recipient.

### B. New Model: `AiPatientSummary`
For caching doctor-generated 7-day patient clinical summaries:
```prisma
model AiPatientSummary {
  id        String   @id @default(uuid()) @db.Uuid
  elderId   String   @db.Uuid
  doctorId  String   @db.Uuid
  forDate   DateTime @db.Date
  content   String   @db.Text
  stats     Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  elder  User @relation("ElderPatientSummaries", fields: [elderId], references: [id], onDelete: Cascade)
  doctor User @relation("DoctorPatientSummaries", fields: [doctorId], references: [id], onDelete: Cascade)

  @@unique([elderId, doctorId, forDate])
  @@index([elderId])
  @@index([doctorId])
  @@map("ai_patient_summaries")
}
```

### C. Row Level Security (RLS)
Updated `prisma/enable_rls.sql` and `supabase/migrations/20250101000000_enable_rls.sql`:
- Executed `ALTER TABLE public.ai_patient_summaries ENABLE ROW LEVEL SECURITY;`
- Configured with **zero public policies**, guaranteeing that direct PostgREST client queries remain blocked and all access is mediated exclusively through the Next.js server connecting as the database owner.

---

## 2. Notification & Escalation Timeline

The background cron engine (`/api/cron/tick`) runs every minute and processes active schedules according to this deterministic timeline:

| Event / Phase | Time Offset | Escalation Level | Actions Performed | Target Audience |
| :--- | :--- | :---: | :--- | :--- |
| **Materialization** | $[T - 6\text{h}, T + 6\text{h}]$ | `0` (PENDING) | Generates `DoseLog` entries in elder's timezone using `skipDuplicates`. | System internal |
| **Due Reminder** | At scheduled time $T$ | `0` $\rightarrow$ `1` | Notifies elder and active caretakers that it is time for the dose. Grouped if multiple medicines are due at the same minute. | Elder & Caretaker (In-app + Email*) |
| **Firm Nudge** | $T + (\text{graceMinutes} / 2)$ | `1` $\rightarrow$ `2` | If still `PENDING`, sends a firm reminder that the grace window is half elapsed. | Elder & Caretaker (In-app + Email*) |
| **Missed Escalation** | $T + \text{graceMinutes}$ | `2` $\rightarrow$ `3` | Marks dose as `MISSED`, sets `notifiedFamilyAt`. Alerts family members of the missed dose and flags the doctor's panel. | Family (In-app + Email*), Caretakers (In-app + Email*), Doctor (In-app only) |
| **Pattern Alert** | On 3 consecutive missed days | Alert | Identifies adherence pattern breakdowns (e.g. 3 consecutive days missing the same time slot). | Family & Caretaker (In-app + Email*), Doctor (In-app) |
| **Stale Cleanup** | $T + 6\text{h}$ | Silent Miss | Silently marks abandoned `PENDING` doses older than 6h as `MISSED` with **no notifications** (prevents spam after system downtime). | System internal |

*\*Note on Phone-Only Protection: Email is dispatched ONLY to users with `hasRealEmail = true`. Elders with generated internal emails (`p<phone>@users.smriti.app`) receive in-app notifications only.*

---

## 3. Complete Stage 2 Endpoint Catalog

### A. Dose Tracking & Adherence
| Endpoint | Method | Allowed Roles | Description |
| :--- | :---: | :--- | :--- |
| `/api/elders/:elderId/doses/mark` | `POST` | `ELDER`, `CARETAKER` | Mark dose as `TAKEN` (elder), `GIVEN` (caretaker), or `SKIPPED`. Enforces window $[-60\text{m}, +12\text{h}]$, decrements stock, alerts family if taken after escalation level 3. |
| `/api/doses/:doseLogId/undo` | `POST` | `ELDER`, `CARETAKER` | Reverts marked dose to `PENDING` within a 10-minute grace window and restores medication inventory. |
| `/api/elders/:elderId/doses` | `GET` | `ELDER`, `CARETAKER`, `DOCTOR` | Paginated dose history filterable by `status`, `medicineId`, `startDate`, `endDate`. |
| `/api/elders/:elderId/today` | `GET` | `ELDER`, `CARETAKER`, `DOCTOR` | Today's doses grouped by time slot (`MORNING`, `AFTERNOON`, `EVENING`, `NIGHT`) with `canMark` flag. |
| `/api/elders/:elderId/adherence` | `GET` | `ELDER`, `CARETAKER`, `DOCTOR` | Pure SQL 7/14/30-day adherence rates, per-medicine breakdown, day series, slot analysis, and miss streak. |

### B. Caretaker Clinical Notes
| Endpoint | Method | Allowed Roles | Description |
| :--- | :---: | :--- | :--- |
| `/api/elders/:elderId/notes` | `POST` | `CARETAKER` | Log clinical observation with severity (`INFO`, `WARNING`, `URGENT`). `URGENT` triggers immediate email alert to all linked doctors. |
| `/api/elders/:elderId/notes` | `GET` | `CARETAKER`, `DOCTOR` | List notes for an elder, filterable by `severity` and `unseenOnly`. |
| `/api/notes/:id/seen` | `PATCH` | `DOCTOR` | Doctor marks an urgent clinical note as acknowledged (`seenAt = now`). |

### C. Doctor Dashboard & Clinical Alerts
| Endpoint | Method | Allowed Roles | Description |
| :--- | :---: | :--- | :--- |
| `/api/doctor/dashboard` | `GET` | `DOCTOR` | Aggregated panel of all linked patients with risk ranking, urgent notes, 7-day adherence, and active alerts. |
| `/api/doctor/alerts` | `GET` | `DOCTOR` | Filtered list of critical patients requiring immediate attention (riskScore $\ge 50$ or unseen urgent notes). |

### D. In-App Notifications
| Endpoint | Method | Allowed Roles | Description |
| :--- | :---: | :--- | :--- |
| `/api/notifications` | `GET` | `ANY` (Self) | Paginated notification feed with `unreadOnly` filter and multilingual titles/bodies. |
| `/api/notifications/unread-count` | `GET` | `ANY` (Self) | Fast count of unread notifications for badge display. |
| `/api/notifications/:id/read` | `PATCH` | `ANY` (Owner) | Mark a single notification as read (`readAt = now`). |
| `/api/notifications/read-all` | `POST` | `ANY` (Owner) | Mark all unread notifications as read. |

### E. Google Gemini AI Features (`@google/genai`)
| Endpoint | Method | Allowed Roles | Description |
| :--- | :---: | :--- | :--- |
| `/api/doctor/brief` | `GET` | `DOCTOR` | Daily Clinical Briefing digest. Reads from `AiBrief` cache or invokes Gemini with deterministic algorithmic fallback. |
| `/api/doctor/brief/refresh` | `POST` | `DOCTOR` | Forces regeneration of the daily clinical briefing. |
| `/api/doctor/elders/:elderId/summary` | `GET` | `DOCTOR` | 7-day AI clinical summary for a specific patient, cached in `AiPatientSummary`. |
| `/api/doctor/elders/:elderId/prescription-scan` | `POST` | `DOCTOR` | Multimodal vision scanner extracting structured medication drafts from prescription photos. |
| `/api/doctor/ask` | `POST` | `DOCTOR` | Natural language clinical assistant using tool function calling strictly scoped to patient data. |

### F. Automated Cron Webhooks
| Endpoint | Method | Auth | Description |
| :--- | :---: | :--- | :--- |
| `/api/cron/tick` | `GET` / `POST` | `Bearer <CRON_SECRET>` | Every 1 minute: materializes doses, advances escalation levels (0$\rightarrow$1$\rightarrow$2$\rightarrow$3), checks 3-day streaks, sends appointment & refill alerts, and dispatches queued emails. Supports `?now=<ISO>` for dev time-travel. |
| `/api/cron/daily` | `GET` / `POST` | `Bearer <CRON_SECRET>` | Daily at 07:00 IST: pre-generates daily AI clinical briefings for all active doctors. |

---

## 4. Permission Matrix Additions

| Feature / Resource | Unlinked User | FAMILY | CARETAKER | DOCTOR | ELDER (Self) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Mark Dose (`TAKEN`)** | `404 Not Found` | `403 Forbidden` | `403 Forbidden` | `403 Forbidden` | `200 OK` |
| **Mark Dose (`GIVEN`/`SKIPPED`)** | `404 Not Found` | `403 Forbidden` | `200 OK` | `403 Forbidden` | `403 Forbidden` |
| **Undo Dose Mark (10 min)** | `404 Not Found` | `403 Forbidden` | `200 OK` (If marked) | `403 Forbidden` | `200 OK` |
| **View Dose History** | `404 Not Found` | `403 Forbidden` | `200 OK` | `200 OK` | `200 OK` |
| **View Today's Doses** | `404 Not Found` | `403 Forbidden` | `200 OK` | `200 OK` | `200 OK` |
| **Create Caretaker Note** | `404 Not Found` | `403 Forbidden` | `201 Created` | `403 Forbidden` | `403 Forbidden` |
| **View Caretaker Notes** | `404 Not Found` | `403 Forbidden` | `200 OK` | `200 OK` | `403 Forbidden` |
| **Mark Note as Seen** | `404 Not Found` | `403 Forbidden` | `403 Forbidden` | `200 OK` | `403 Forbidden` |
| **View Adherence Analytics** | `404 Not Found` | `403 Forbidden` | `200 OK` | `200 OK` | `200 OK` |
| **Doctor Dashboard / Alerts** | N/A | `403 Forbidden` | `403 Forbidden` | `200 OK` | `403 Forbidden` |
| **AI Briefings & Summaries** | `404 Not Found` | `403 Forbidden` | `403 Forbidden` | `200 OK` | `403 Forbidden` |
| **Scan Prescription** | `404 Not Found` | `403 Forbidden` | `403 Forbidden` | `200 OK` | `403 Forbidden` |
| **Doctor AI Q&A** | `404 Not Found` | `403 Forbidden` | `403 Forbidden` | `200 OK` | `403 Forbidden` |
| **User Notifications** | `200` (Own only) | `200` (Own only) | `200` (Own only) | `200` (Own only) | `200` (Own only) |

---

## 5. Standard Error Codes Added in Stage 2

| Code | HTTP Status | Description |
| :--- | :---: | :--- |
| `DOSE_WINDOW_CLOSED` | 400 | Attempted to mark a dose outside the allowable window (earlier than 60 min before or later than 12 hours after scheduled time). |
| `DOSE_NOT_MARKABLE` | 400 | Attempted to mark a dose that is not in a valid state (e.g. already TAKEN/GIVEN/SKIPPED). |
| `UNDO_WINDOW_EXPIRED` | 400 | Attempted to undo a dose mark after the 10-minute undo window has elapsed. |
| `AI_RATE_LIMITED` | 429 | Doctor exceeded the safety rate limit of 20 AI requests per hour. |
| `AI_UNAVAILABLE` | 503 | Gemini API timed out (15s) or exhausted retries; fallback used where applicable. |

---

## 6. Background Cron Engine & Idempotency Design

1. **Security & Constant-Time Validation:**
   - Both `/api/cron/tick` and `/api/cron/daily` accept `GET` and `POST`.
   - Bearer token is compared against `CRON_SECRET` using `crypto.timingSafeEqual` to eliminate timing side-channel attacks.
2. **Serverless Limits & Timeout Defense:**
   - `export const maxDuration = 60;` is configured on all cron route handlers.
   - Email outbox processing operates with a strict 40-second time budget and batches at most 25 emails per invocation to guarantee clean completion within serverless limits.
3. **Double-Execution & Overlap Idempotency:**
   - Dose materialization uses `createMany({ skipDuplicates: true })` keyed on `@@unique([scheduleId, scheduledFor])`.
   - Notifications leverage the database constraint `@@unique([userId, dedupeKey])`.
   - Escalation updates check current status and escalation level atomically in Prisma queries (`where: { escalationLevel: 0, status: "PENDING" }`), ensuring overlapping runs cannot advance a dose twice.
4. **Dev Time-Travel:**
   - Passing `?now=<ISO_TIMESTAMP>` in non-production environments overrides the current time, enabling instantaneous verification of multi-hour escalation sequences.

---

## 7. Assumptions & Sensible Decisions

1. **Deterministic Analytics over AI:** Adherence percentages, streak counts, and risk scores are calculated purely using deterministic SQL/Prisma aggregations. Gemini AI is strictly fed pre-computed JSON and is never permitted to calculate adherence or invent patient statistics.
2. **Clinical Safety Safeguards:**
   - Every AI response embeds the mandatory clinical disclaimer: *"AI-generated clinical summary for review only. Verify with patient records before clinical decisions."*
   - Prompts strictly forbid recommending medication dosages, changing prescriptions, or generating diagnoses.
3. **Multilingual Architecture:** Message templates are centrally cataloged in `src/lib/i18n/messages.ts` with complete English, Hindi, and Marathi translations. Time slots (सुबह, दोपहर, शाम, रात) and medication warnings are rendered in the recipient's registered language.
4. **Inventory Control:** Marking a dose `TAKEN` or `GIVEN` atomically decrements `stockCount` (if tracked). Undoing the dose within 10 minutes increments `stockCount` back. When stock drops below `refillThreshold`, a single `REFILL_REMINDER` is dispatched to caretakers.
5. **Doctor Risk Formula:** A deterministic clinical risk score $[0, 100]$ prioritizes patients requiring immediate doctor attention:
   $$\text{Risk} = (100 - \text{Adherence}_{7\text{d}}) \times 0.5 + (\text{Active Missed Doses} \times 10) + (\text{Unseen Urgent Notes} \times 25) + (\text{Miss Streak} \ge 3 \ ?\ 20 : 0)$$
