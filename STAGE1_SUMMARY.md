# SMRITI PLATFORM — STAGE 1 BACKEND FOUNDATION SUMMARY

This document summarizes the complete Stage 1 backend architecture, data model, API endpoints, permission matrix, authentication design, and assumptions for the **Smriti** Elderly Care & Medication Management Platform.

---

## 1. Final Prisma Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum Role {
  DOCTOR
  ELDER
  CARETAKER
  FAMILY
}

enum AccessStatus {
  ACTIVE
  REVOKED
}

enum MedicineForm {
  TABLET
  CAPSULE
  SYRUP
  INJECTION
  DROPS
  INHALER
  OINTMENT
  OTHER
}

enum MedicineStatus {
  ACTIVE
  PAUSED
  STOPPED
}

enum FoodRelation {
  BEFORE_FOOD
  AFTER_FOOD
  WITH_FOOD
  ANYTIME
}

enum TimeSlot {
  MORNING
  AFTERNOON
  EVENING
  NIGHT
}

enum AppointmentStatus {
  SCHEDULED
  COMPLETED
  CANCELLED
}

enum DoseStatus {
  PENDING
  TAKEN
  GIVEN
  MISSED
  SKIPPED
}

enum NoteSeverity {
  INFO
  WARNING
  URGENT
}

enum NotificationType {
  MISSED_DOSE
  UPCOMING_DOSE
  APPOINTMENT_REMINDER
  CARETAKER_NOTE
  REFILL_REMINDER
  SYSTEM
}

model User {
  id                 String          @id @db.Uuid
  name               String
  email              String?         @unique
  authEmail          String          @unique
  hasRealEmail       Boolean         @default(true)
  phone              String?         @unique
  role               Role
  language           String          @default("en")
  isActive           Boolean         @default(true)
  mustChangePassword Boolean         @default(false)
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt

  doctorProfile       DoctorProfile?
  elderProfile        ElderProfile?   @relation("UserElderProfile")
  createdElders       ElderProfile[]  @relation("DoctorCreatedElders")

  elderAccessAsElder  ElderAccess[]   @relation("ElderToAccess")
  elderAccessAsMember ElderAccess[]   @relation("MemberToAccess")

  createdInvites      InviteCode[]    @relation("InviteCreator")
  usedInvites         InviteCode[]    @relation("InviteUser")
  elderInvites        InviteCode[]    @relation("ElderInvites")
  redeemAttempts      RedeemAttempt[]

  prescribedMedicines Medicine[]      @relation("DoctorPrescriptions")
  elderMedicines      Medicine[]      @relation("ElderMedicines")

  createdAppointments Appointment[]   @relation("CreatedAppointments")
  doctorAppointments  Appointment[]   @relation("DoctorAppointments")
  elderAppointments   Appointment[]   @relation("ElderAppointments")

  markedDoseLogs      DoseLog[]       @relation("MarkedDoses")
  elderDoseLogs       DoseLog[]       @relation("ElderDoseLogs")

  authoredNotes       CaretakerNote[] @relation("AuthorNotes")
  elderNotes          CaretakerNote[] @relation("ElderCaretakerNotes")

  notifications       Notification[]  @relation("UserNotifications")
  elderNotifications  Notification[]  @relation("ElderNotifications")

  actorAuditLogs      AuditLog[]      @relation("ActorAuditLogs")
  elderAuditLogs      AuditLog[]      @relation("ElderAuditLogs")

  aiBriefs            AiBrief[]

  @@map("users")
}

model DoctorProfile {
  id                 String   @id @default(uuid()) @db.Uuid
  userId             String   @unique @db.Uuid
  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  specialization     String
  registrationNumber String
  clinicName         String
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@map("doctor_profiles")
}

model ElderProfile {
  id                    String   @id @default(uuid()) @db.Uuid
  userId                String   @unique @db.Uuid
  user                  User     @relation("UserElderProfile", fields: [userId], references: [id], onDelete: Cascade)
  dateOfBirth           DateTime?
  gender                String?
  bloodGroup            String?
  medicalConditions     String?  @db.Text
  allergies             String?  @db.Text
  emergencyContactName  String?
  emergencyContactPhone String?
  timezone              String   @default("Asia/Kolkata")
  largeTextMode         Boolean  @default(true)
  voiceReminders        Boolean  @default(false)
  createdByDoctorId     String?  @db.Uuid
  createdByDoctor       User?    @relation("DoctorCreatedElders", fields: [createdByDoctorId], references: [id], onDelete: SetNull)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@map("elder_profiles")
}

model ElderAccess {
  id                String       @id @default(uuid()) @db.Uuid
  elderId           String       @db.Uuid
  memberId          String       @db.Uuid
  role              Role
  status            AccessStatus @default(ACTIVE)
  linkedViaInviteId String?      @db.Uuid
  revokedAt         DateTime?
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  elder             User         @relation("ElderToAccess", fields: [elderId], references: [id], onDelete: Cascade)
  member            User         @relation("MemberToAccess", fields: [memberId], references: [id], onDelete: Cascade)
  linkedViaInvite   InviteCode?  @relation("InviteAccess", fields: [linkedViaInviteId], references: [id], onDelete: SetNull)

  @@unique([elderId, memberId])
  @@index([elderId])
  @@index([memberId])
  @@index([status])
  @@map("elder_access")
}

model InviteCode {
  id           String        @id @default(uuid()) @db.Uuid
  code         String        @unique
  elderId      String        @db.Uuid
  createdById  String        @db.Uuid
  intendedRole Role
  expiresAt    DateTime
  usedAt       DateTime?
  usedById     String?       @db.Uuid
  revokedAt    DateTime?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  elder        User          @relation("ElderInvites", fields: [elderId], references: [id], onDelete: Cascade)
  createdBy    User          @relation("InviteCreator", fields: [createdById], references: [id], onDelete: Cascade)
  usedBy       User?         @relation("InviteUser", fields: [usedById], references: [id], onDelete: SetNull)
  elderAccess  ElderAccess[] @relation("InviteAccess")

  @@index([elderId])
  @@index([code])
  @@map("invite_codes")
}

model RedeemAttempt {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @db.Uuid
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  success   Boolean
  createdAt DateTime @default(now())

  @@index([userId, createdAt])
  @@map("redeem_attempts")
}

model Medicine {
  id              String            @id @default(uuid()) @db.Uuid
  elderId         String            @db.Uuid
  prescribedById  String            @db.Uuid
  name            String
  nameLocal       String?
  genericName     String?
  dosage          String
  form            MedicineForm
  foodRelation    FoodRelation      @default(ANYTIME)
  instructions    String?           @db.Text
  warnings        String?           @db.Text
  status          MedicineStatus    @default(ACTIVE)
  startDate       DateTime
  endDate         DateTime?
  stockCount      Int?
  refillThreshold Int?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  elder           User              @relation("ElderMedicines", fields: [elderId], references: [id], onDelete: Cascade)
  prescribedBy    User              @relation("DoctorPrescriptions", fields: [prescribedById], references: [id], onDelete: Restrict)
  schedules       MedicineSchedule[]
  doseLogs        DoseLog[]

  @@index([elderId, status])
  @@map("medicines")
}

model MedicineSchedule {
  id           String     @id @default(uuid()) @db.Uuid
  medicineId   String     @db.Uuid
  timeOfDay    String
  slot         TimeSlot
  daysOfWeek   Int[]      @default([0, 1, 2, 3, 4, 5, 6])
  doseQuantity String     @default("1 tablet")
  graceMinutes Int        @default(30)
  isActive     Boolean    @default(true)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  medicine     Medicine   @relation(fields: [medicineId], references: [id], onDelete: Cascade)
  doseLogs     DoseLog[]

  @@index([medicineId])
  @@map("medicine_schedules")
}

model Appointment {
  id                String            @id @default(uuid()) @db.Uuid
  elderId           String            @db.Uuid
  doctorId          String?           @db.Uuid
  createdById       String            @db.Uuid
  title             String
  scheduledAt       DateTime
  location          String?
  notes             String?           @db.Text
  status            AppointmentStatus @default(SCHEDULED)
  reminder24hSentAt DateTime?
  reminder2hSentAt  DateTime?
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  elder             User              @relation("ElderAppointments", fields: [elderId], references: [id], onDelete: Cascade)
  doctor            User?             @relation("DoctorAppointments", fields: [doctorId], references: [id], onDelete: SetNull)
  createdBy         User              @relation("CreatedAppointments", fields: [createdById], references: [id], onDelete: Cascade)

  @@index([elderId, scheduledAt])
  @@map("appointments")
}

model DoseLog {
  id               String           @id @default(uuid()) @db.Uuid
  scheduleId       String           @db.Uuid
  medicineId       String           @db.Uuid
  elderId          String           @db.Uuid
  scheduledFor     DateTime
  status           DoseStatus       @default(PENDING)
  markedById       String?          @db.Uuid
  markedByRole     Role?
  markedAt         DateTime?
  escalationLevel  Int              @default(0)
  notifiedFamilyAt DateTime?
  note             String?          @db.Text
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  schedule         MedicineSchedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  medicine         Medicine         @relation(fields: [medicineId], references: [id], onDelete: Cascade)
  elder            User             @relation("ElderDoseLogs", fields: [elderId], references: [id], onDelete: Cascade)
  markedBy         User?            @relation("MarkedDoses", fields: [markedById], references: [id], onDelete: SetNull)

  @@unique([scheduleId, scheduledFor])
  @@index([elderId, scheduledFor])
  @@index([status, scheduledFor])
  @@map("dose_logs")
}

model CaretakerNote {
  id           String       @id @default(uuid()) @db.Uuid
  elderId      String       @db.Uuid
  authorId     String       @db.Uuid
  text         String       @db.Text
  severity     NoteSeverity @default(INFO)
  doctorSeenAt DateTime?
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  elder        User         @relation("ElderCaretakerNotes", fields: [elderId], references: [id], onDelete: Cascade)
  author       User         @relation("AuthorNotes", fields: [authorId], references: [id], onDelete: Cascade)

  @@index([elderId, createdAt])
  @@map("caretaker_notes")
}

model Notification {
  id          String           @id @default(uuid()) @db.Uuid
  userId      String           @db.Uuid
  elderId     String?          @db.Uuid
  type        NotificationType
  title       String
  body        String           @db.Text
  data        Json?
  readAt      DateTime?
  emailSentAt DateTime?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  user        User             @relation("UserNotifications", fields: [userId], references: [id], onDelete: Cascade)
  elder       User?            @relation("ElderNotifications", fields: [elderId], references: [id], onDelete: Cascade)

  @@index([userId, readAt])
  @@map("notifications")
}

model AuditLog {
  id        String   @id @default(uuid()) @db.Uuid
  actorId   String?  @db.Uuid
  elderId   String?  @db.Uuid
  action    String
  entity    String
  entityId  String
  before    Json?
  after     Json?
  createdAt DateTime @default(now())

  actor     User?    @relation("ActorAuditLogs", fields: [actorId], references: [id], onDelete: SetNull)
  elder     User?    @relation("ElderAuditLogs", fields: [elderId], references: [id], onDelete: Cascade)

  @@index([elderId, createdAt])
  @@map("audit_logs")
}

model AiBrief {
  id        String   @id @default(uuid()) @db.Uuid
  doctorId  String   @db.Uuid
  briefDate DateTime @db.Date
  content   String   @db.Text
  stats     Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  doctor    User     @relation(fields: [doctorId], references: [id], onDelete: Cascade)

  @@unique([doctorId, briefDate])
  @@map("ai_briefs")
}
```

---

## 2. API Endpoint Catalog

All routes return standard JSON envelopes:
- Success: `{ "ok": true, "data": ..., "meta": ... }`
- Error: `{ "ok": false, "error": { "code": "...", "message": "...", "details": ... } }`

| Method | Path | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | System status, service name, Stage 1 version |
| `POST` | `/api/auth/register` | Public | Creates auth user with admin client, then User + Profile in DB transaction |
| `POST` | `/api/auth/login` | Public | Accepts real email OR phone, signs in via Supabase, returns tokens + cookies |
| `POST` | `/api/auth/logout` | Authenticated | Signs out session |
| `GET` | `/api/me` | Authenticated | Returns current profile with role-specific details (sanitized) |
| `PATCH` | `/api/me` | Authenticated | Updates name, phone, language, and role-specific fields |
| `POST` | `/api/me/change-password` | Authenticated | Verifies old password, updates password, clears `mustChangePassword` |
| `GET` | `/api/me/elders` | Authenticated | Returns linked elders (minimal for FAMILY, full clinical for DOCTOR/CARETAKER) |
| `DELETE` | `/api/me/links/:elderId` | Authenticated | Member unlinks themselves from an elder (`REVOKED`) |
| `POST` | `/api/doctor/elders` | `DOCTOR` | Doctor creates elder account, auto-links self, returns temp password once |
| `GET` | `/api/doctor/elders` | `DOCTOR` | Lists linked patients with `activeMedicineCount` and `nextAppointmentAt` |
| `GET` | `/api/elders/:elderId` | `SELF`, `DOCTOR`, `CARETAKER`, `FAMILY` | Returns profile (FAMILY receives name only; unlinked returns 404) |
| `PATCH` | `/api/elders/:elderId` | `SELF`, `DOCTOR` | Updates elder medical profile & conditions (Caretaker/Family rejected 403) |
| `POST` | `/api/elders/:elderId/invites` | `SELF` (any), `CARETAKER` (FAMILY only) | Generates single-use 48h passcode (`K7QD-9M2X`) |
| `GET` | `/api/elders/:elderId/invites` | `SELF` | Lists active unexpired invite codes |
| `DELETE` | `/api/elders/:elderId/invites/:inviteId` | `SELF` | Revokes an unused invite code |
| `POST` | `/api/invites/redeem` | Authenticated | Redeems passcode; checks role match; throttles brute-force (5 fails/15m) |
| `GET` | `/api/elders/:elderId/members` | `SELF` | Lists care team members linked to this elder |
| `DELETE` | `/api/elders/:elderId/members/:memberId` | `SELF` | Elder revokes member access link (`REVOKED`) |
| `POST` | `/api/elders/:elderId/medicines` | `DOCTOR` | Prescribes medicine with nested schedules and slot auto-derivation |
| `GET` | `/api/elders/:elderId/medicines` | `SELF`, `DOCTOR`, `CARETAKER` | Lists elder's medicines (FAMILY rejected 403) |
| `GET` | `/api/medicines/:id` | `SELF`, `DOCTOR`, `CARETAKER` | Medicine details with schedules |
| `PATCH` | `/api/medicines/:id` | `DOCTOR` | Updates medicine dosage, warnings, instructions, stock |
| `PUT` | `/api/medicines/:id/schedules` | `DOCTOR` | Replaces all schedules for a medicine in one transaction |
| `DELETE` | `/api/medicines/:id` | `DOCTOR` | Soft stop: sets `status = STOPPED` (never hard-deletes clinical data) |
| `GET` | `/api/elders/:elderId/today` | `SELF`, `DOCTOR`, `CARETAKER` | Today's doses in elder's timezone, grouped by TimeSlot with DoseLog status |
| `POST` | `/api/elders/:elderId/appointments` | `DOCTOR` | Schedules medical appointment |
| `GET` | `/api/elders/:elderId/appointments` | `SELF`, `DOCTOR`, `CARETAKER` | Lists appointments (from, to, status filters) |
| `PATCH` | `/api/appointments/:id` | `DOCTOR` | Updates appointment time, venue, notes |
| `DELETE` | `/api/appointments/:id` | `DOCTOR` | Cancels appointment (`status = CANCELLED`) |
| `GET` | `/api/elders/:elderId/audit-log` | `SELF`, `DOCTOR` | Paginated audit trail of all medical and access changes |

---

## 3. Permission & IDOR Matrix

| Resource / Action | Unlinked User | `FAMILY` | `CARETAKER` | `DOCTOR` | `ELDER` (Self) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Get Elder Profile** | `404 Not Found` | `200` (Name only) | `200` (Full) | `200` (Full) | `200` (Full) |
| **Edit Elder Profile** | `404 Not Found` | `403 Forbidden` | `403 Forbidden` | `200 OK` | `200 OK` |
| **View Medicines** | `404 Not Found` | `403 Forbidden` | `200 OK` | `200 OK` | `200 OK` |
| **Prescribe/Edit Medicines**| `404 Not Found` | `403 Forbidden` | `403 Forbidden` | `200/201 OK` | `403 Forbidden`|
| **View /today Doses** | `404 Not Found` | `403 Forbidden` | `200 OK` | `200 OK` | `200 OK` |
| **Create Invite Code** | `404 Not Found` | `403 Forbidden` | `201` (FAMILY only)| `403 Forbidden`| `201` (Any role)|
| **List/Revoke Invites**| `404 Not Found` | `403 Forbidden` | `403 Forbidden` | `403 Forbidden`| `200 OK` |
| **List/Revoke Members**| `404 Not Found` | `403 Forbidden` | `403 Forbidden` | `403 Forbidden`| `200 OK` |
| **Unlink Self** | `404 Not Found` | `200 OK` | `200 OK` | `200 OK` | N/A |
| **Create/Edit Appointments**| `404 Not Found`| `403 Forbidden` | `403 Forbidden` | `200/201 OK` | `403 Forbidden`|
| **View Audit Trail** | `404 Not Found` | `403 Forbidden` | `403 Forbidden` | `200 OK` | `200 OK` |

*Note: Unlinked users always receive `404 Not Found` across all elder-scoped resources to prevent identifier enumeration.*

---

## 4. Standard Error Codes (Frontend Localization Ready)

The following stable `UPPER_SNAKE_CASE` codes are emitted in all API error payloads so the frontend can display translated error alerts in Hindi and Marathi:

| Code | HTTP Status | Description |
| :--- | :---: | :--- |
| `UNAUTHORIZED` | 401 | Missing, malformed, or expired session token |
| `INVALID_CREDENTIALS`| 401 | Invalid email/phone or password |
| `FORBIDDEN` | 403 | Insufficient role or access permissions for this action |
| `USER_DEACTIVATED` | 403 | User account has been deactivated |
| `NOT_FOUND` | 404 | Resource does not exist OR caller is not linked (IDOR protection) |
| `CONFLICT` | 409 | Duplicate email, phone, or active constraint |
| `VALIDATION_ERROR` | 422 | Zod schema validation failed (field-level path & error array) |
| `INVITE_INVALID` | 400 | Passcode does not exist or has been revoked |
| `INVITE_EXPIRED` | 400 | Passcode has exceeded its 48-hour validity window |
| `INVITE_ALREADY_USED`| 400 | Passcode was already redeemed |
| `TOO_MANY_ATTEMPTS` | 429 | Brute-force throttling triggered (5 failed redemptions in 15 mins) |
| `INTERNAL_SERVER_ERROR`| 500 | Unexpected server exception |

---

## 5. Supabase Auth Design & Phone-Only Flow

1. **Three Specialized Supabase Clients (`src/lib/supabase/`):**
   - `server.ts`: Built with `@supabase/ssr`, reads and refreshes session cookies for browser clients.
   - `admin.ts`: Built with `SUPABASE_SERVICE_ROLE_KEY`. Strict server-only client for user creation (`email_confirm: true`), administrative rollbacks, and credential management.
   - `token.ts`: Verifies incoming `Authorization: Bearer <token>` directly against Supabase Auth with `supabase.auth.getUser(token)`. Never trusts unverified or decoded JWTs.
2. **Dual-Mode Request Authentication (`requireAuth`):**
   - Checks `Authorization: Bearer <token>` first (ideal for Postman / API consumers).
   - If header is absent, checks Supabase session cookies (ideal for web UI).
   - Loads public `User` row from PostgreSQL. **User role is read strictly from `public.users.role`** and never from JWT claims.
3. **Phone-Only User Scheme:**
   - Normalizes phone numbers to standard format (default `+91`).
   - If real email is missing, assigns deterministic internal auth email: `p<digits>@users.smriti.app`.
   - `hasRealEmail = false` ensures Stage 2 email notifications bypass this user.
   - Identifier resolution in login route resolves either real email OR phone number to `authEmail`.
4. **Doctor-Created Elder Accounts:**
   - Admin client creates confirmed auth user with a generated temporary password (e.g. `Smriti!9aF24b8C9A`).
   - Transaction creates `User` + `ElderProfile` + auto-linked `ElderAccess` (DOCTOR).
   - `mustChangePassword = true` is set.
   - Temporary password is returned **once** to the doctor.
5. **Row-Level Security Hardening:**
   - `prisma/enable_rls.sql` enables RLS across all 14 public tables with zero public policies. Direct PostgREST client queries with anon key are completely blocked.

---

## 6. Daily Dose Expansion Logic (`/api/elders/:elderId/today`)

1. Reads the elder's configured timezone from `ElderProfile.timezone` (default `"Asia/Kolkata"`).
2. Computes the current date string (`YYYY-MM-DD`) and day-of-week (`0=Sunday` to `6=Saturday`) in that timezone using `date-fns-tz`.
3. Finds active medications whose start date is on or before today and whose end date is on or after today.
4. Filters schedules active on today's day-of-week.
5. Converts each local `timeOfDay` ("HH:mm") into a UTC timestamp (`scheduledFor`).
6. Looks up corresponding `DoseLog` records for `(scheduleId, scheduledFor)`.
7. Enriches each dose with medication name, local name (`nameLocal`), dosage, instructions, warnings, and current `DoseStatus` (`PENDING`, `TAKEN`, `GIVEN`, `MISSED`, `SKIPPED`).
8. Groups doses into sorted time slots: `MORNING`, `AFTERNOON`, `EVENING`, `NIGHT`.

---

## 7. Assumptions & Sensible Decisions

1. **Invite Passcode Character Set:** Generated from a 31-character alphabet (`23456789ABCDEFGHJKMNPQRSTUVWXYZ`) excluding ambiguous characters `0`, `O`, `1`, `I`, and `L` to ensure legibility when communicated verbally or via SMS.
2. **Time Slot Auto-Derivation:**
   - `MORNING`: 05:00 – 11:59
   - `AFTERNOON`: 12:00 – 16:59
   - `EVENING`: 17:00 – 20:59
   - `NIGHT`: 21:00 – 04:59
3. **Soft Stops & Historical Integrity:** Deleting a medicine sets `status = STOPPED`. Deleting an appointment sets `status = CANCELLED`. Medical records are never hard-deleted from PostgreSQL.
4. **Compensating Transactions:** If public DB user profile creation fails after auth user creation in Supabase, the backend immediately calls `supabaseAdmin.auth.admin.deleteUser` to prevent orphan auth records.
5. **Re-linking After Revoke:** If an elder revokes a member and later re-invites them, redeeming the new invite reactivates the existing `ElderAccess` row (`status = ACTIVE`, `revokedAt = null`) rather than creating a duplicate row.
6. **Stage 2 Placeholders:** Clean placeholder files created in `src/lib/email/`, `src/lib/scheduler/`, `src/lib/ai/`, and `src/app/api/cron/` with type definitions and zero TODO stubs.
