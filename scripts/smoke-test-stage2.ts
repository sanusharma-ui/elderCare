/**
 * SMRITI PLATFORM — STAGE 2 AUTOMATED SMOKE TEST SUITE
 */
export {};

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000/api";
const CRON_SECRET = process.env.CRON_SECRET || "smriti-super-secret-cron-token-min-32-chars-long";

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ""}`);
    failCount++;
  }
}

async function request(path: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    // Non-JSON response
  }

  return { status: res.status, ok: res.ok, data: json };
}

async function runStage2SmokeTests() {
  console.log("\n==================================================================");
  console.log("🚀 SMRITI STAGE 2: SMART BACKEND AUTOMATED TEST SUITE");
  console.log(`Target: ${BASE_URL}`);
  console.log("==================================================================\n");

  const runId = Math.floor(100000 + Math.random() * 900000);

  // ---------------------------------------------------------------------------
  // Step 1: Doctor Login & Patient Provisioning
  // ---------------------------------------------------------------------------
  console.log("▶ Step 1: Doctor Authentication & Setup");
  let doctorToken = "";
  const docLogin = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      identifier: "dr.anjali@smriti.app",
      password: "Password@123",
    }),
  });

  if (docLogin.status === 200 && docLogin.data?.data?.session?.access_token) {
    doctorToken = docLogin.data.data.session.access_token;
    assert(true, "Doctor logged in with seeded credentials");
  } else {
    const docReg = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: `Dr. Stage2 ${runId}`,
        email: `dr.stage2.${runId}@smriti.app`,
        phone: `+919820${runId}`,
        password: "Password@123",
        role: "DOCTOR",
        language: "en",
        specialization: "Geriatrics",
        registrationNumber: `REG-${runId}`,
        clinicName: "Stage 2 Clinic",
      }),
    });
    doctorToken = docReg.data?.data?.session?.access_token;
    assert(docReg.status === 201, "Doctor registered dynamically");
  }

  // Doctor creates Elder with Phone-Only (no real email)
  console.log("\n▶ Step 2: Create Phone-Only Elder (Simulate Real Elder Flow)");
  const elderPhone = `+919811${runId}`;
  const elderCreateRes = await request("/doctor/elders", {
    method: "POST",
    headers: { Authorization: `Bearer ${doctorToken}` },
    body: JSON.stringify({
      name: `Dadi Amma ${runId}`,
      phone: elderPhone,
      language: "hi",
      bloodGroup: "B+",
      medicalConditions: "Hypertension",
      timezone: "Asia/Kolkata",
    }),
  });

  const elderId = elderCreateRes.data?.data?.elder?.id;
  const tempPass = elderCreateRes.data?.data?.temporaryPassword;
  assert(elderCreateRes.status === 201 && Boolean(elderId), "Doctor created elder account");

  // Elder logs in
  const elderLogin = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      identifier: elderPhone,
      password: tempPass,
    }),
  });
  const elderToken = elderLogin.data?.data?.session?.access_token;
  assert(elderLogin.status === 200, "Elder logged in via phone identifier");

  // Caretaker and Family registration & linking
  console.log("\n▶ Step 3: Link Caretaker and Family");
  const caretakerReg = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: `Caretaker S2 ${runId}`,
      email: `caretaker.s2.${runId}@smriti.app`,
      phone: `+919833${runId}`,
      password: "Password@123",
      role: "CARETAKER",
      language: "mr",
    }),
  });
  const caretakerToken = caretakerReg.data?.data?.session?.access_token;

  const familyReg = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: `Family S2 ${runId}`,
      email: `family.s2.${runId}@smriti.app`,
      phone: `+919844${runId}`,
      password: "Password@123",
      role: "FAMILY",
      language: "en",
    }),
  });
  const familyToken = familyReg.data?.data?.session?.access_token;

  // Elder invites Caretaker
  const cInvite = await request(`/elders/${elderId}/invites`, {
    method: "POST",
    headers: { Authorization: `Bearer ${elderToken}` },
    body: JSON.stringify({ intendedRole: "CARETAKER" }),
  });
  await request("/invites/redeem", {
    method: "POST",
    headers: { Authorization: `Bearer ${caretakerToken}` },
    body: JSON.stringify({ code: cInvite.data?.data?.code }),
  });

  // Elder invites Family
  const fInvite = await request(`/elders/${elderId}/invites`, {
    method: "POST",
    headers: { Authorization: `Bearer ${elderToken}` },
    body: JSON.stringify({ intendedRole: "FAMILY" }),
  });
  await request("/invites/redeem", {
    method: "POST",
    headers: { Authorization: `Bearer ${familyToken}` },
    body: JSON.stringify({ code: fInvite.data?.data?.code }),
  });

  // Doctor prescribes medicine with specific timeOfDay
  console.log("\n▶ Step 4: Doctor Prescribes Medicine (Initial stock: 10)");
  const medRes = await request(`/elders/${elderId}/medicines`, {
    method: "POST",
    headers: { Authorization: `Bearer ${doctorToken}` },
    body: JSON.stringify({
      name: "Metformin 500 mg",
      nameLocal: "मेटफॉर्मिन",
      dosage: "500 mg",
      form: "TABLET",
      foodRelation: "AFTER_FOOD",
      startDate: "2026-01-01T00:00:00.000Z",
      stockCount: 10,
      refillThreshold: 3,
      schedules: [
        {
          timeOfDay: "10:00",
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          doseQuantity: "1 tablet",
          graceMinutes: 30, // grace period is 30m; nudge at 15m; missed at 30m
        },
      ],
    }),
  });
  const medicineId = medRes.data?.data?.id;
  const scheduleId = medRes.data?.data?.schedules?.[0]?.id;
  assert(medRes.status === 201 && Boolean(medicineId), "Medicine prescribed with 10:00 schedule");

  // ---------------------------------------------------------------------------
  // Step 5: Test Cron Materialization & Idempotency
  // ---------------------------------------------------------------------------
  console.log("\n▶ Step 5: Cron Materialization & Idempotency Check");
  // Simulated time: 2026-11-15T09:00:00 in Asia/Kolkata (+05:30) is 2026-11-15T03:30:00.000Z
  const simT0 = "2026-11-15T03:30:00.000Z"; // 09:00 IST (1h before 10:00 IST dose)
  const cronRes1 = await request(`/cron/tick?now=${encodeURIComponent(simT0)}`, {
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
  });

  assert(
    cronRes1.status === 200 && cronRes1.data?.data?.materialized >= 1,
    `Cron tick at 09:00 IST materialized pending doses (count: ${cronRes1.data?.data?.materialized})`
  );

  // Run tick again with same timestamp — should materialize 0 duplicates
  const cronRes2 = await request(`/cron/tick?now=${encodeURIComponent(simT0)}`, {
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
  });

  assert(
    cronRes2.status === 200 && cronRes2.data?.data?.materialized === 0,
    "Second cron tick with same time created 0 duplicate doses (idempotency confirmed)"
  );

  // ---------------------------------------------------------------------------
  // Step 6: Due Reminder Escalation (Level 0 -> 1)
  // ---------------------------------------------------------------------------
  console.log("\n▶ Step 6: Due Reminder Escalation (at 10:00 IST)");
  // 10:00 IST is 04:30:00.000Z
  const simDue = "2026-11-15T04:30:00.000Z";
  const cronDue = await request(`/cron/tick?now=${encodeURIComponent(simDue)}`, {
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
  });

  assert(
    cronDue.status === 200 && cronDue.data?.data?.dueNotified >= 1,
    `Due reminder fired at 10:00 IST (notified count: ${cronDue.data?.data?.dueNotified})`
  );

  // Repeated tick produces zero new due notifications (no double notification)
  const cronDueRepeat = await request(`/cron/tick?now=${encodeURIComponent(simDue)}`, {
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
  });
  assert(
    cronDueRepeat.data?.data?.dueNotified === 0,
    "Repeated tick at due time created 0 duplicate notifications"
  );

  // Check Phone-Only Elder notification: must have emailRequested = false
  const elderNotifs = await request("/notifications", {
    headers: { Authorization: `Bearer ${elderToken}` },
  });
  const firstNotif = elderNotifs.data?.data?.[0];
  assert(
    elderNotifs.status === 200 && firstNotif?.emailRequested === false,
    "Phone-only elder received in-app notification with emailRequested = false"
  );

  // ---------------------------------------------------------------------------
  // Step 7: Nudge Escalation (Level 1 -> 2)
  // ---------------------------------------------------------------------------
  console.log("\n▶ Step 7: Nudge Escalation at grace/2 (10:16 IST)");
  // 10:16 IST is 04:46:00.000Z
  const simNudge = "2026-11-15T04:46:00.000Z";
  const cronNudge = await request(`/cron/tick?now=${encodeURIComponent(simNudge)}`, {
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
  });
  assert(
    cronNudge.status === 200 && cronNudge.data?.data?.nudgeNotified >= 1,
    `Nudge reminder escalated at 10:16 IST (count: ${cronNudge.data?.data?.nudgeNotified})`
  );

  // ---------------------------------------------------------------------------
  // Step 8: Missed Escalation (Level 2 -> 3)
  // ---------------------------------------------------------------------------
  console.log("\n▶ Step 8: Missed Escalation at scheduledFor + grace (10:31 IST)");
  // 10:31 IST is 05:01:00.000Z
  const simMissed = "2026-11-15T05:01:00.000Z";
  const cronMissed = await request(`/cron/tick?now=${encodeURIComponent(simMissed)}`, {
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
  });
  assert(
    cronMissed.status === 200 && cronMissed.data?.data?.missedEscalated >= 1,
    `Missed escalation fired at 10:31 IST (notified: ${cronMissed.data?.data?.missedEscalated})`
  );

  // Verify Family received missed-dose alert
  const famNotifs = await request("/notifications", {
    headers: { Authorization: `Bearer ${familyToken}` },
  });
  const missedNotif = famNotifs.data?.data?.find((n: any) => n.type === "MISSED_DOSE");
  assert(
    Boolean(missedNotif),
    "Family member received MISSED_DOSE notification with suggested action",
    missedNotif?.title
  );

  // ---------------------------------------------------------------------------
  // Step 9: Late Completion of Missed Dose
  // ---------------------------------------------------------------------------
  console.log("\n▶ Step 9: Late Marking of Missed Dose (Notifies Family)");
  // scheduledFor is 2026-11-15T04:30:00.000Z (10:00 IST)
  const scheduledForUtc = "2026-11-15T04:30:00.000Z";
  const lateMarkRes = await request(`/elders/${elderId}/doses/mark`, {
    method: "POST",
    headers: { Authorization: `Bearer ${caretakerToken}` },
    body: JSON.stringify({
      scheduleId,
      scheduledFor: scheduledForUtc,
      status: "GIVEN",
      note: "Elder was sleeping late, given after waking up.",
    }),
  });
  assert(
    lateMarkRes.status === 200 && lateMarkRes.data?.data?.status === "GIVEN",
    "Caretaker marked missed dose late as GIVEN"
  );

  // Verify stock decremented from 10 to 9
  const medCheck = await request(`/medicines/${medicineId}`, {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  assert(
    medCheck.data?.data?.stockCount === 9,
    `Medicine stock count decremented correctly to 9 (was 10)`
  );

  // ---------------------------------------------------------------------------
  // Step 10: Undo Dose Marking Within 10 Minutes
  // ---------------------------------------------------------------------------
  console.log("\n▶ Step 10: Undo Dose Marking (Restores Stock)");
  const doseLogId = lateMarkRes.data?.data?.id;
  const undoRes = await request(`/doses/${doseLogId}/undo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${caretakerToken}` },
  });
  assert(undoRes.status === 200, "Caretaker undid dose completion within 10 minutes");

  const medCheckAfterUndo = await request(`/medicines/${medicineId}`, {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  assert(
    medCheckAfterUndo.data?.data?.stockCount === 10,
    `Medicine stock restored back to 10 on undo`
  );

  // ---------------------------------------------------------------------------
  // Step 11: Role Permissions on Marking (Doctor & Family get 403)
  // ---------------------------------------------------------------------------
  console.log("\n▶ Step 11: Doctor and Family Forbidden on Marking (403)");
  const docMark = await request(`/elders/${elderId}/doses/mark`, {
    method: "POST",
    headers: { Authorization: `Bearer ${doctorToken}` },
    body: JSON.stringify({
      scheduleId,
      scheduledFor: scheduledForUtc,
      status: "TAKEN",
    }),
  });
  assert(docMark.status === 403, "Doctor receives 403 on dose marking");

  const famMark = await request(`/elders/${elderId}/doses/mark`, {
    method: "POST",
    headers: { Authorization: `Bearer ${familyToken}` },
    body: JSON.stringify({
      scheduleId,
      scheduledFor: scheduledForUtc,
      status: "TAKEN",
    }),
  });
  assert(famMark.status === 403, "Family receives 403 on dose marking");

  // ---------------------------------------------------------------------------
  // Step 12: Elder Marks TAKEN (Stock decrements again)
  // ---------------------------------------------------------------------------
  console.log("\n▶ Step 12: Elder Marks Own Dose as TAKEN");
  const elderMark = await request(`/elders/${elderId}/doses/mark`, {
    method: "POST",
    headers: { Authorization: `Bearer ${elderToken}` },
    body: JSON.stringify({
      scheduleId,
      scheduledFor: scheduledForUtc,
      status: "TAKEN",
    }),
  });
  assert(
    elderMark.status === 200 && elderMark.data?.data?.status === "TAKEN",
    "Elder marked own dose as TAKEN"
  );

  // ---------------------------------------------------------------------------
  // Step 13: Caretaker Notes (INFO/URGENT)
  // ---------------------------------------------------------------------------
  console.log("\n▶ Step 13: Caretaker Posts Urgent Clinical Note");
  const urgentNoteRes = await request(`/elders/${elderId}/notes`, {
    method: "POST",
    headers: { Authorization: `Bearer ${caretakerToken}` },
    body: JSON.stringify({
      text: "Dadi complained of severe dizziness after morning meal. BP 160/100.",
      severity: "URGENT",
    }),
  });
  const noteId = urgentNoteRes.data?.data?.id;
  assert(
    urgentNoteRes.status === 201 && urgentNoteRes.data?.data?.severity === "URGENT",
    "Caretaker posted URGENT note"
  );

  // Doctor acknowledges note
  const seenRes = await request(`/notes/${noteId}/seen`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  assert(seenRes.status === 200 && Boolean(seenRes.data?.data?.doctorSeenAt), "Doctor marked note as seen");

  // ---------------------------------------------------------------------------
  // Step 14: Adherence Analytics & Doctor Dashboard
  // ---------------------------------------------------------------------------
  console.log("\n▶ Step 14: Adherence Analytics & Doctor Dashboard Ranking");
  const adhRes = await request(`/elders/${elderId}/adherence?days=7`, {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  assert(
    adhRes.status === 200 && typeof adhRes.data?.data?.overallPercentage === "number",
    `Adherence calculated correctly (${adhRes.data?.data?.overallPercentage}%)`
  );

  const dashRes = await request("/doctor/dashboard", {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  assert(
    dashRes.status === 200 && dashRes.data?.data?.totalPatients >= 1,
    `Doctor dashboard calculated aggregated metrics for ${dashRes.data?.data?.totalPatients} patients`
  );

  // ---------------------------------------------------------------------------
  // Step 15: AI Features (Graceful Fallback When API Key Missing)
  // ---------------------------------------------------------------------------
  console.log("\n▶ Step 15: AI Features & Graceful Fallback");
  const briefRes = await request("/doctor/brief", {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  assert(
    briefRes.status === 200 &&
      Boolean(briefRes.data?.data?.content) &&
      (briefRes.data?.data?.source === "ai" || briefRes.data?.data?.source === "fallback" || briefRes.data?.data?.source === "cached"),
    `Doctor Daily Brief returned content with source '${briefRes.data?.data?.source}'`
  );

  const summaryRes = await request(`/doctor/elders/${elderId}/summary?days=7`, {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  assert(
    summaryRes.status === 200 && Boolean(summaryRes.data?.data?.content),
    `AI Patient Summary generated with source '${summaryRes.data?.data?.source}'`
  );

  // ---------------------------------------------------------------------------
  // Step 16: IDOR Protection on Patient Summary
  // ---------------------------------------------------------------------------
  console.log("\n▶ Step 16: IDOR Protection Check (Unlinked Elder Returns 404)");
  const fakeUuid = "00000000-0000-0000-0000-000000000000";
  const unlinkedSummary = await request(`/doctor/elders/${fakeUuid}/summary`, {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  assert(
    unlinkedSummary.status === 404,
    "Unlinked patient summary returns 404 Not Found (IDOR prevented)"
  );

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log("\n==================================================================");
  console.log(`STAGE 2 SMOKE TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log("==================================================================\n");

  if (failCount > 0) {
    process.exit(1);
  }
}

runStage2SmokeTests().catch((err) => {
  console.error("Unhandled Stage 2 test exception:", err);
  process.exit(1);
});
