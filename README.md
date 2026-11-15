# स्मृति • Smriti
### Elderly Care & Medication Management Platform — Complete Full-Stack Solution (Stages 1, 2 & 3)

[![Next.js](https://img.shields.io/badge/Next.js-15.1.7-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19.3-2D3748?logo=prisma)](https://www.prisma.io/)
[![Google GenAI](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8E75B2?logo=google)](https://aistudio.google.com/)
[![PWA](https://img.shields.io/badge/PWA-Installable-1F5C4A?logo=pwa)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🌟 Overview

**Smriti** is an intelligent, multi-generational elderly care and medication adherence ecosystem designed specifically for Indian families, caretakers, and doctors. It solves the critical problem of senior medication non-adherence through a shared care circle, localized language support (Hindi, Marathi, English), touch-first mobile interfaces, proactive multi-tier escalation alerts, and AI-assisted clinical briefings.

### Platform Architecture & Role Partitioning:
- **ELDER, CARETAKER, FAMILY (Mobile-First Installable PWA):** Designed for 360px–430px smartphone viewports with touch-first interactions, bottom sheets, large tap targets (56px+), speech synthesis ("सुनो"), and standalone installation. On desktop screens, rendered inside a centered phone-width column (`MobileShell`).
- **DOCTOR (Web-First Desktop Clinical Console):** Wide split-view ledger layout (`DesktopShell`) with high-density stat strips, patient directories, schedule editors, Google Gemini Vision prescription scanning, and natural language clinical Q&A.

---

## 👥 Demo Accounts (Pre-Seeded)

If `NEXT_PUBLIC_DEMO_MODE=true` is enabled, one-tap demo buttons appear on the login screen. You can also sign in manually with any of the seeded accounts:

| Role | Name | Email / Phone | Password | Key Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **DOCTOR** | Dr. Anjali Mehta | `dr.anjali@smriti.app` | `Password@123` | Prescribe meds, AI daily brief, prescription scan, clinical Q&A, appointments. |
| **ELDER** | Ramesh Sharma | `+919811122332` | `Password@123` | High adherence profile, listen aloud, mark taken (56px button), generate invites. |
| **ELDER** | Suresh Kulkarni | `+919822012345` | `Password@123` | Poor adherence profile (3-day miss streak for demoing doctor alerts). |
| **CARETAKER** | Pooja Sawant | `pooja.sawant@care.in` | `Password@123` | Elder switcher, mark given/skipped, log clinical notes (URGENT email alert). |
| **FAMILY** | Amit Sharma | `amit.sharma@family.com` | `Password@123` | Linked to Ramesh Sharma, receives missed dose alerts, links elders via passcode. |

---

## 📱 PWA Features & Testing Guide

Smriti is configured as a standalone Progressive Web App with custom app manifest, adaptive icons, and offline caching.

### 1. How to Test the PWA Locally
To experience the true Service Worker and install prompts, run the production build (dev mode intentionally bypasses Service Worker registration to prevent stale caching):

```bash
# 1. Build production bundle
npm run build

# 2. Start production server
npm run start
```
Open [http://localhost:3000](http://localhost:3000) in Chrome or Edge.

### 2. Device Toolbar & Lighthouse Audit
1. Open Chrome DevTools (`F12` or `Ctrl+Shift+I`).
2. Toggle the **Device Toolbar** (`Ctrl+Shift+M`) and select **iPhone 14 / Pixel 7** (390px–430px).
3. Navigate to **Application > Manifest** to verify the manifest, background color `#FAF5EA`, theme color `#1F5C4A`, and 192px/512px icons.
4. Navigate to **Application > Service Workers** to inspect `public/sw.js`.
5. Run a **Lighthouse Audit** under the "Progressive Web App" category to verify installability and offline fallback.

### 3. Installing on Android & iOS
- **Android (Chrome):** When visiting the home screen or `/elder/me`, tap the prompt **"Install Smriti App"** or tap the browser menu (⋮) -> **"Add to Home screen"**. The app will launch in standalone mode with no browser URL bar.
- **iOS (Safari):** Tap the **Share** button (box with upward arrow) at the bottom of Safari, scroll down, and tap **"Add to Home Screen"**.

### ⚠️ Honest Limitation: Background Push Notifications
> [!NOTE]
> Smriti does not currently implement Web Push Server keys (VAPID/FCM) in the backend. On mobile devices, sound/vibration alerts trigger while the app is open, and speech synthesis reads due medicines aloud. Background alerting is reliably handled via **proactive multi-tier emails** sent directly to family and caretakers by the minute cron engine (`/api/cron/tick`).

---

## ⏱️ 3-Minute Judge Demo Script

Follow this step-by-step sequence to demonstrate the entire ecosystem in 3 minutes:

### Step 1: Doctor Prescribes Medication & Reviews AI Brief (Desktop)
1. Navigate to `/login` and click the **"डॉक्टर • Doctor"** demo button.
2. Review the **AI Daily Clinical Digest** at the top of the dashboard.
3. Click **"मरीज निर्देशिका • Patients Directory"** and select **"सुरेश कुलकर्णी • Suresh Kulkarni"**.
4. In the patient overview, note the **7-day adherence rate** and the **AI 7-day brief**.
5. Switch to the **"AI पर्चा स्कैनर • Scan"** tab: upload a prescription photo to see Google Gemini Vision extract structured draft medicines.

### Step 2: Elder Marks Dose in Hindi on Mobile PWA
1. Open an incognito window or log out, then click the **"बुजुर्ग • Elder (Ramesh)"** demo button.
2. Notice the **MobileShell** centered phone layout (or view on phone).
3. Switch language to **हिन्दी** or **मराठी**.
4. Click the **"सुनो • Listen"** button to hear the Web Speech API announce today's medication schedule in Hindi.
5. On the **"Next Dose"** card, click the large 56px button **"मैंने ले ली • I Took It"**:
   - Device vibrates (if supported).
   - Dose transitions to taken (green).
   - Medication inventory decrements.
   - An **Undo** toast appears with a 10-minute validity window.

### Step 3: Trigger a Simulated Missed Dose (Dev Time-Travel)
In a terminal, simulate time advancing 45 minutes past a scheduled dose using the non-production `?now=` webhook:
```bash
curl -X POST "http://localhost:3000/api/cron/tick?now=2026-11-15T09:45:00Z" \
  -H "Authorization: Bearer test_cron_secret"
```
The cron engine advances the pending dose from Escalation Level 0 to Level 3 (`MISSED`), logs `notifiedFamilyAt`, and queues urgent alerts.

### Step 4: Family Member Receives Alert & Care Circle Note
1. Log in as **"परिवार • Family (Amit)"**.
2. View `/family/home`: see the high-priority **MISSED DOSE** alert with the prompt: *"You may want to give them a quick call to check in."*
3. Click **"जोड़ें • Link"** to inspect the 9-character single-use passcode input (`K7QD-9M2X`).

### Step 5: Caretaker Logs Urgent Note & Doctor Acknowledges
1. Log in as **"केयरटेकर • Caretaker (Pooja)"**.
2. Go to `/caretaker/notes` and write an observation with severity **URGENT** (e.g., *"Patient reported dizziness after lunch"*).
3. Return to the **Doctor** account:
   - Notice the **Unseen Notes** counter increment.
   - Go to patient Suresh's notes tab and click **"देखा हुआ मार्क करें • Mark Seen"**.
   - Use the **"Ask Smriti"** AI assistant to ask: *"सुरेश जी ने इस हफ्ते सुबह की दवा कितनी बार छोड़ी?"* and verify the clinical answer with cited tools.

---

## 🎨 Design Tokens & Visual Language

- **Palette:**
  - `paper`: `#FAF5EA` (calming diary surface)
  - `paper-2`: `#F3EBDA` (outer desktop canvas)
  - `surface`: `#FFFDF7` (card panels)
  - `ink`: `#1E2B25` (WCAG AAA primary text)
  - `ink-muted`: `#5B665F` (subtitles & labels)
  - `forest`: `#1F5C4A` (primary brand)
  - `saffron`: `#E39B2B` (accent & warning callouts)
  - `ok`: `#2F7D4F` (taken / given / success)
  - `brick`: `#B93A2B` (missed / urgent / danger)
- **Typography:** "Mukta" (body & Devanagari UI), "Fraunces" (Latin display headings), "Noto Serif Devanagari" (Hindi/Marathi display headings). Base font size 17px, with Elder Large Text scaling up to 20px+.

---

## 🧪 Verification & Build Status

- `npx tsc --noEmit`: **0 errors** (Strict mode)
- `npx next build`: **Compiled successfully** (All 42 static & dynamic routes production-ready)
- Automated Smoke Test: `npm run test:smoke:stage2` passing 16 integration checks.