# SMRITI PLATFORM — COMPREHENSIVE QA CHECKLIST (STAGE 3)

This checklist provides a structured test matrix across all four roles (**ELDER**, **CARETAKER**, **FAMILY**, **DOCTOR**), three languages (**Hindi**, **Marathi**, **English**), multiple viewport form factors (**360px Mobile**, **Desktop Phone-Frame**, **Full-Width Desktop Console**), and PWA standalone/offline states.

---

## 1. Cross-Platform Viewport & Layout Matrix

| Viewport / Environment | Expected Shell Behavior | Status |
| :--- | :--- | :---: |
| **Mobile Screen (360px–430px)** | Fullscreen touch interface, zero horizontal scrolling, bottom navigation fixed with `pb-safe`, bottom sheets slide up smoothly. | PASS |
| **Desktop Browser (> 600px) - Mobile Roles** | App renders inside a centered phone-width column (`max-w-[430px]`, `rounded-3xl`, `shadow-smriti-float`) with calming `bg-paper-2` background and branding sidebar on wide screens. | PASS |
| **Desktop Browser - Doctor Console** | Expands to full browser width (`DesktopShell`), multi-column ledger view, high-density stats strip, accessible sidebar/top navigation. | PASS |
| **Installed PWA Standalone Mode** | No browser URL bar or bottom navigation controls; theme color matches `#1F5C4A`; safe-area insets honored. | PASS |
| **Offline Mode (Airplane Mode)** | Network-only for API requests; navigation fallback displays localized `/offline` screen with "Try Again" button. | PASS |

---

## 2. Role-by-Role Functional Checklist

### A. Elder Experience (`/elder/...`)
- [ ] **Today Schedule (`/elder/today`)**:
  - [ ] Time-of-day greeting renders correctly in the active language with elder's name.
  - [ ] Progress ring shows accurate fraction of completed doses (e.g. "2 of 4 taken").
  - [ ] "Next Dose" card prominently surfaces the immediate pending dose.
  - [ ] Primary action button is at least **56px high** ("मैंने ले ली" / "I Took It").
  - [ ] Marking a dose vibrates the phone (feature-detected), decrements stock, turns card green, and triggers a 10-minute **Undo toast**.
  - [ ] Prominent saffron warning callout displays "what NOT to do" directly on card.
  - [ ] "सुनो / Listen" button announces schedule aloud via Web Speech API in Hindi (`hi-IN`), Marathi (`mr-IN`), or English (`en-IN`).
- [ ] **Medicines (`/elder/medicines`)**:
  - [ ] Read-only view displays all active prescriptions with localized names (`nameLocal`), food relations, and dosage timings.
- [ ] **Appointments (`/elder/appointments`)**:
  - [ ] Displays scheduled doctor appointments with doctor name, date/time, and clinic address.
- [ ] **My Settings & Circle (`/elder/me`)**:
  - [ ] Toggling **Large Text Mode** scales root font size from 17px to 20px+ (`data-text-size="large"`).
  - [ ] Language switcher switches between हिन्दी, मराठी, and English instantly.
  - [ ] "Add Family / Caretaker / Doctor" opens bottom sheet, generates 9-character passcode (`K7QD-9M2X`), and provides WhatsApp share link.
  - [ ] Revoke button removes a connected member with confirmation.

---

### B. Caretaker Experience (`/caretaker/...`)
- [ ] **Elder Switcher**:
  - [ ] Switcher dropdown at top allows toggling between multiple assigned elders.
  - [ ] Selecting an elder persists in local state and refreshes schedule and adherence.
- [ ] **Today Doses (`/caretaker/today`)**:
  - [ ] Mini 7-day adherence indicator displays calculated percentage and consecutive miss streaks.
  - [ ] Doses offer "Mark Given" and "Skip" buttons with undo capabilities.
- [ ] **Medicines & Inventory (`/caretaker/medicines`)**:
  - [ ] Low-stock banner surfaces medicines where `stockCount <= refillThreshold`.
- [ ] **Clinical Notes (`/caretaker/notes`)**:
  - [ ] Quick composer accepts note text with `INFO`, `WARNING`, and `URGENT` severity.
  - [ ] Submitting an `URGENT` note displays warning that doctor will be emailed immediately.
  - [ ] Notes feed displays author, timestamp, and doctor acknowledgement indicator (`seenAt`).
- [ ] **Circle Management (`/caretaker/me`)**:
  - [ ] Caretakers can generate **FAMILY** invite codes only (backend enforces 403 on DOCTOR/CARETAKER codes).

---

### C. Family Experience (`/family/...`)
- [ ] **Home & Alerts (`/family/home`)**:
  - [ ] Displays linked elder names (minimal permissions: zero clinical or prescription leakage).
  - [ ] Alert feed surfaces missed doses and late-taken notifications in reverse chronological order.
  - [ ] Missed dose card includes calm reassurance: *"You may want to give them a quick call to check in."*
  - [ ] Unlink button disconnects family member with confirmation.
- [ ] **Link Another Elder (`/family/link`)**:
  - [ ] 9-character input automatically formats code in uppercase with hyphen (`K7QD-9M2X`).
  - [ ] Redeeming a valid code instantly links elder and refreshes feed.
  - [ ] Reusing a redeemed code displays clear error message (`INVITE_ALREADY_USED`).

---

### D. Doctor Experience (`/doctor/...`)
- [ ] **Dashboard (`/doctor/dashboard`)**:
  - [ ] 5-card stat strip displays total patients, on track, needs attention, high risk, and unseen notes.
  - [ ] AI Daily Brief card shows daily clinical digest with "AI" / "Auto summary" badge, refresh button, and disclaimer.
  - [ ] Ranked "Needs attention" list sorts patients by risk score with reason chips (`LOW_ADHERENCE`, `MISS_STREAK`, `URGENT_NOTE`, `LOW_STOCK`).
  - [ ] "Ask Smriti" assistant accepts clinical questions, calls scoped database tools, and outputs answers with source attribution.
- [ ] **Patient Directory (`/doctor/patients`)**:
  - [ ] Fast search filters patients by name, phone, or email across 200+ records.
- [ ] **Add Patient (`/doctor/patients/new`)**:
  - [ ] Registering an elder generates a confirmed account and reveals a **temporary password shown once** with Copy and Share options.
- [ ] **Patient Profile Tabs (`/doctor/patients/[elderId]`)**:
  - [ ] **Overview**: Displays 7-day AI summary, adherence tiles, and per-medicine breakdown.
  - [ ] **Prescriptions**: Add medicine sheet with frequency presets (Morning 08:00, Afternoon 14:00, Night 21:00) and stop medicine button.
  - [ ] **AI Prescription Scan**: Uploading a prescription photo invokes Gemini Vision and extracts structured editable drafts. Clicking "Approve & Add" commits the prescription to the patient.
  - [ ] **Appointments**: Schedule visit form creates upcoming appointments.
  - [ ] **Notes**: Review caretaker clinical notes; clicking "Mark Seen" clears urgent flags.
  - [ ] **Dose Log**: Paginated audit table of all past dose states.
  - [ ] **Circle & Audit**: Displays connected members and tamper-evident audit trail.

---

## 3. Multilingual Verification Matrix

| Key Flow | English (`en`) | Hindi (`hi`) | Marathi (`mr`) |
| :--- | :--- | :--- | :--- |
| **Elder Next Dose Button** | "I Took It" | "मैंने ले ली" | "मी घेतले" |
| **Missed Dose Late Mark** | "Take it now?" | "क्या अब लेना चाहते हैं?" | "आता घ्यायचे आहे का?" |
| **Time Slot (08:00)** | Morning | सुबह | सकाळ |
| **Time Slot (14:00)** | Afternoon | दोपहर | दुपार |
| **Time Slot (18:00)** | Evening | शाम | संध्याकाळ |
| **Time Slot (21:00)** | Night | रात | रात्र |
| **Food Relation** | After Food | खाना खाने के बाद | जेवणानंतर |
| **Passcode WhatsApp Message**| "Hello! I have invited you to my Smriti care circle. Use passcode: {code} within 48 hours to connect." | "नमस्ते! मैंने आपको अपने स्मृति केयर सर्कल में आमंत्रित किया है। जुड़ने के लिए 48 घंटों के अंदर इस कोड का उपयोग करें: {code}" | "नमस्कार! मी तुम्हाला माझ्या स्मृती केअर वर्तुळात आमंत्रित केले आहे. जोडण्यासाठी 48 तासांत हा कोड वापरा: {code}" |

---

## 4. PWA & Offline Verification

- [ ] **App Manifest (`/manifest.webmanifest`)**:
  - [ ] Short name: `Smriti`.
  - [ ] Start URL: `/` (redirects server-side to appropriate role home).
  - [ ] Display: `standalone`.
  - [ ] Theme color: `#1F5C4A`; Background color: `#FAF5EA`.
  - [ ] Valid PNG icons: 192x192, 512x512, maskable 512x512, and apple-touch-icon 180x180.
- [ ] **Service Worker (`/sw.js`)**:
  - [ ] Registers client-side strictly in production builds (`NODE_ENV === "production"`).
  - [ ] Precaches `/offline` fallback page, manifest, and core icons.
  - [ ] Cache-first for static Next.js assets (`/_next/static/*`) and fonts.
  - [ ] **STRICT NETWORK-ONLY** for `/api/*` requests and authenticated medical data (zero stale healthcare records).
  - [ ] Disconnecting internet while navigating displays friendly localized offline page.
- [ ] **Install Prompt (`InstallPrompt.tsx`)**:
  - [ ] On Chrome/Android, captures `beforeinstallprompt` and renders dismissible card.
  - [ ] On iOS Safari, displays step-by-step "Share -> Add to Home Screen" instructions.
  - [ ] Hidden automatically when running in standalone mode.
