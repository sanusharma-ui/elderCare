/**
 * SMRITI PLATFORM - END-TO-END AUTOMATED SMOKE TEST
 * 
 * Verifies core Stage 1 architectural requirements against a running server:
 * 1. Health check
 * 2. Doctor authentication
 * 3. Doctor creates elder account directly (returns temp password)
 * 4. Elder logs in with temporary password via phone
 * 5. Caretaker and Family registration
 * 6. Elder generates single-use passcode invite
 * 7. Caretaker redeems invite
 * 8. Reused invite code fails (INVITE_ALREADY_USED)
 * 9. Doctor prescribes medicine with schedules
 * 10. Caretaker reads /today (expanded in elder's timezone)
 * 11. Caretaker is rejected when modifying medicine (403)
 * 12. Family member is rejected when accessing medicines (403)
 * 13. IDOR protection: accessing unlinked elder returns 404
 * 14. Elder revokes caretaker access
 * 15. Revoked caretaker loses access immediately (404)
 */

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000/api";

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
  if (!headers.has("Content-Type") && options.body) {
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
    // response not json
  }

  return { status: res.status, ok: res.ok, data: json };
}

async function runSmokeTests() {
  console.log("\n==================================================================");
  console.log("🚀 SMRITI BACKEND STAGE 1: END-TO-END SMOKE TEST SUITE");
  console.log(`Target: ${BASE_URL}`);
  console.log("==================================================================\n");

  const runId = Math.floor(100000 + Math.random() * 900000);

  // ---------------------------------------------------------------------------
  // Check 1: Health Check
  // ---------------------------------------------------------------------------
  console.log("▶ Step 1: System Health Check");
  const healthRes = await request("/health");
  assert(
    healthRes.status === 200 && healthRes.data?.data?.status === "healthy",
    "GET /api/health returns 200 healthy",
    JSON.stringify(healthRes.data)
  );

  // ---------------------------------------------------------------------------
  // Check 2: Doctor Authentication
  // ---------------------------------------------------------------------------
  console.log("\n▶ Step 2: Doctor Authentication");
  let doctorToken: string = "";
  let doctorId: string = "";

  // Try login first (from seed)
  const docLogin = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      identifier: "dr.anjali@smriti.app",
      password: "Password@123",
    }),
  });

  if (docLogin.status === 200 && docLogin.data?.data?.session?.access_token) {
    doctorToken = docLogin.data.data.session.access_token;
    doctorId = docLogin.data.data.user.id;
    assert(true, "Doctor logged in successfully with seeded credentials");
  } else {
    // Register dynamic doctor
    const docReg = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: `Dr. Smoke Test ${runId}`,
        email: `dr.smoke${runId}@smriti.app`,
        phone: `+919820${runId}`,
        password: "Password@123",
        role: "DOCTOR",
        language: "en",
        specialization: "Geriatrician",
        registrationNumber: `REG-${runId}`,
        clinicName: "Smoke Test Clinic",
      }),
    });
    doctorToken = docReg.data?.data?.session?.access_token;
    doctorId = docReg.data?.data?.user?.id;
    assert(
      docReg.status === 201 && Boolean(doctorToken),
      "Doctor registered dynamically",
      JSON.stringify(docReg.data)
    );
  }

  // ---------------------------------------------------------------------------
  // Check 3: Doctor Creates Elder Account Directly
  // ---------------------------------------------------------------------------
  console.log("\n▶ Step 3: Doctor Creates Elder Account (Auto-links Doctor)");
  const elderPhone = `+919811${runId}`;
  const createElderRes = await request("/doctor/elders", {
    method: "POST",
    headers: { Authorization: `Bearer ${doctorToken}` },
    body: JSON.stringify({
      name: `Elder Smoke ${runId}`,
      phone: elderPhone,
      language: "hi",
      bloodGroup: "O+",
      medicalConditions: "Hypertension, Osteoarthritis",
      emergencyContactName: "Son",
      emergencyContactPhone: `+919844${runId}`,
      timezone: "Asia/Kolkata",
    }),
  });

  const elderId = createElderRes.data?.data?.elder?.id;
  const tempPassword = createElderRes.data?.data?.temporaryPassword;

  assert(
    createElderRes.status === 201 && Boolean(elderId) && Boolean(tempPassword),
    "Doctor created elder account with temporary password",
    JSON.stringify(createElderRes.data)
  );

  // ---------------------------------------------------------------------------
  // Check 4: Elder Logs In with Temporary Password via Phone
  // ---------------------------------------------------------------------------
  console.log("\n▶ Step 4: Elder Logs In with Temporary Password via Phone");
  const elderLoginRes = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      identifier: elderPhone,
      password: tempPassword,
    }),
  });

  const elderToken = elderLoginRes.data?.data?.session?.access_token;
  assert(
    elderLoginRes.status === 200 &&
      Boolean(elderToken) &&
      elderLoginRes.data?.data?.user?.mustChangePassword === true,
    "Elder logged in successfully via phone and mustChangePassword is true",
    JSON.stringify(elderLoginRes.data)
  );

  // ---------------------------------------------------------------------------
  // Check 5 & 6: Register Caretaker and Family Member
  // ---------------------------------------------------------------------------
  console.log("\n▶ Step 5 & 6: Register Caretaker and Family Accounts");
  const caretakerReg = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: `Caretaker Smoke ${runId}`,
      email: `caretaker${runId}@smriti.app`,
      phone: `+919833${runId}`,
      password: "Password@123",
      role: "CARETAKER",
      language: "mr",
    }),
  });

  const caretakerToken = caretakerReg.data?.data?.session?.access_token;
  const caretakerUserId = caretakerReg.data?.data?.user?.id;
  assert(
    caretakerReg.status === 201 && Boolean(caretakerToken),
    "Caretaker account registered",
    JSON.stringify(caretakerReg.data)
  );

  const familyReg = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: `Family Smoke ${runId}`,
      email: `family${runId}@smriti.app`,
      phone: `+919844${runId}`,
      password: "Password@123",
      role: "FAMILY",
      language: "hi",
    }),
  });

  const familyToken = familyReg.data?.data?.session?.access_token;
  const familyUserId = familyReg.data?.data?.user?.id;
  assert(
    familyReg.status === 201 && Boolean(familyToken),
    "Family account registered",
    JSON.stringify(familyReg.data)
  );

  // ---------------------------------------------------------------------------
  // Check 7: Elder Generates Passcode Invite for Caretaker
  // ---------------------------------------------------------------------------
  console.log("\n▶ Step 7: Elder Generates Single-Use Invite Code");
  const inviteRes = await request(`/elders/${elderId}/invites`, {
    method: "POST",
    headers: { Authorization: `Bearer ${elderToken}` },
    body: JSON.stringify({ intendedRole: "CARETAKER" }),
  });

  const inviteCode = inviteRes.data?.data?.code;
  assert(
    inviteRes.status === 201 && Boolean(inviteCode),
    `Elder generated invite code: ${inviteCode}`,
    JSON.stringify(inviteRes.data)
  );

  // ---------------------------------------------------------------------------
  // Check 8: Caretaker Redeems Invite
  // ---------------------------------------------------------------------------
  console.log("\n▶ Step 8: Caretaker Redeems Invite Code");
  const redeemRes = await request("/invites/redeem", {
    method: "POST",
    headers: { Authorization: `Bearer ${caretakerToken}` },
    body: JSON.stringify({ code: inviteCode }),
  });

  assert(
    redeemRes.status === 200 && redeemRes.data?.data?.role === "CARETAKER",
    "Caretaker redeemed invite code and gained CARETAKER access",
    JSON.stringify(redeemRes.data)
  );

  // ---------------------------------------------------------------------------
  // Check 9: Reused Invite Code Fails
  // ---------------------------------------------------------------------------
  console.log("\n▶ Step 9: Reusing Redeemed Invite Code Fails");
  const reuseRes = await request("/invites/redeem", {
    method: "POST",
    headers: { Authorization: `Bearer ${caretakerToken}` },
    body: JSON.stringify({ code: inviteCode }),
  });

  assert(
    reuseRes.status === 400 && reuseRes.data?.error?.code === "INVITE_ALREADY_USED",
    "Reused invite code correctly rejected with 400 INVITE_ALREADY_USED",
    JSON.stringify(reuseRes.data)
  );

  // Also link Family member for subsequent permission checks
  const famInviteRes = await request(`/elders/${elderId}/invites`, {
    method: "POST",
    headers: { Authorization: `Bearer ${elderToken}` },
    body: JSON.stringify({ intendedRole: "FAMILY" }),
  });
  const famInviteCode = famInviteRes.data?.data?.code;
  await request("/invites/redeem", {
    method: "POST",
    headers: { Authorization: `Bearer ${familyToken}` },
    body: JSON.stringify({ code: famInviteCode }),
  });

  // ---------------------------------------------------------------------------
  // Check 10: Doctor Adds Medicine with Nested Schedules
  // ---------------------------------------------------------------------------
  console.log("\n▶ Step 10: Doctor Adds Medicine with Schedules");
  const addMedRes = await request(`/elders/${elderId}/medicines`, {
    method: "POST",
    headers: { Authorization: `Bearer ${doctorToken}` },
    body: JSON.stringify({
      name: "Metformin 500 mg",
      nameLocal: "मेटफॉर्मिन 500 मिलीग्राम",
      genericName: "Metformin Hydrochloride",
      dosage: "500 mg",
      form: "TABLET",
      foodRelation: "AFTER_FOOD",
      instructions: "भोजन के तुरंत बाद 1 गोली लें।",
      warnings: "खाली पेट न लें।",
      startDate: new Date().toISOString(),
      stockCount: 60,
      schedules: [
        {
          timeOfDay: "08:30",
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          doseQuantity: "1 tablet",
          graceMinutes: 30,
        },
        {
          timeOfDay: "20:30",
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          doseQuantity: "1 tablet",
          graceMinutes: 30,
        },
      ],
    }),
  });

  const medicineId = addMedRes.data?.data?.id;
  assert(
    addMedRes.status === 201 && Boolean(medicineId),
    "Doctor prescribed Metformin with 2 daily schedules",
    JSON.stringify(addMedRes.data)
  );

  // ---------------------------------------------------------------------------
  // Check 11: Caretaker Reads /today
  // ---------------------------------------------------------------------------
  console.log("\n▶ Step 11: Caretaker Reads /today (Doses in Elder Timezone)");
  const todayRes = await request(`/elders/${elderId}/today`, {
    headers: { Authorization: `Bearer ${caretakerToken}` },
  });

  const hasMorningSlot = Boolean(todayRes.data?.data?.slots?.MORNING?.length > 0);
  assert(
    todayRes.status === 200 && hasMorningSlot,
    "Caretaker read /today successfully with doses grouped into slots",
    `Total doses: ${todayRes.data?.data?.summary?.total}`
  );

  // ---------------------------------------------------------------------------
  // Check 12: Caretaker Rejected When Editing Medicine (403)
  // ---------------------------------------------------------------------------
  console.log("\n▶ Step 12: Caretaker Modifying Medicine Is Rejected (403)");
  const caretakerEditMed = await request(`/medicines/${medicineId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${caretakerToken}` },
    body: JSON.stringify({ dosage: "1000 mg" }),
  });

  assert(
    caretakerEditMed.status === 403,
    "Caretaker cannot modify medicine (correctly received 403 Forbidden)",
    JSON.stringify(caretakerEditMed.data)
  );

  // ---------------------------------------------------------------------------
  // Check 13: Family Member Rejected on Medicines (403)
  // ---------------------------------------------------------------------------
  console.log("\n▶ Step 13: Family Member Accessing Medicines Is Rejected (403)");
  const familyMedAccess = await request(`/elders/${elderId}/medicines`, {
    headers: { Authorization: `Bearer ${familyToken}` },
  });

  assert(
    familyMedAccess.status === 403,
    "Family member cannot view medications (correctly received 403 Forbidden)",
    JSON.stringify(familyMedAccess.data)
  );

  // ---------------------------------------------------------------------------
  // Check 14: IDOR Protection (Unlinked Elder Returns 404)
  // ---------------------------------------------------------------------------
  console.log("\n▶ Step 14: IDOR Protection Check (Unlinked Elder Returns 404)");
  const fakeElderUuid = "a0000000-0000-0000-0000-000000000000";
  const idorRes = await request(`/elders/${fakeElderUuid}`, {
    headers: { Authorization: `Bearer ${caretakerToken}` },
  });

  assert(
    idorRes.status === 404,
    "Accessing unlinked elder returns 404 (IDOR prevention, no existence leakage)",
    JSON.stringify(idorRes.data)
  );

  // ---------------------------------------------------------------------------
  // Check 15: Elder Revokes Caretaker Access
  // ---------------------------------------------------------------------------
  console.log("\n▶ Step 15: Elder Revokes Caretaker Access");
  const revokeRes = await request(`/elders/${elderId}/members/${caretakerUserId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${elderToken}` },
  });

  assert(
    revokeRes.status === 200,
    "Elder successfully revoked caretaker access link",
    JSON.stringify(revokeRes.data)
  );

  // ---------------------------------------------------------------------------
  // Check 16: Revoked Caretaker Loses Access (Returns 404)
  // ---------------------------------------------------------------------------
  console.log("\n▶ Step 16: Revoked Caretaker Loses Access Immediately");
  const revokedAccessCheck = await request(`/elders/${elderId}/today`, {
    headers: { Authorization: `Bearer ${caretakerToken}` },
  });

  assert(
    revokedAccessCheck.status === 404,
    "Revoked caretaker access returns 404 (link inactive)",
    JSON.stringify(revokedAccessCheck.data)
  );

  // ---------------------------------------------------------------------------
  // Test Summary
  // ---------------------------------------------------------------------------
  console.log("\n==================================================================");
  console.log(`SMOKE TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log("==================================================================\n");

  if (failCount > 0) {
    process.exit(1);
  }
}

runSmokeTests().catch((err) => {
  console.error("Unhandled smoke test exception:", err);
  process.exit(1);
});
