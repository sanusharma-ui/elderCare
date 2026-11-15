import {
  AccessStatus,
  AppointmentStatus,
  DoseStatus,
  FoodRelation,
  MedicineForm,
  MedicineStatus,
  PrismaClient,
  Role,
} from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { subDays } from "date-fns";
import dotenv from "dotenv";
import { deriveTimeSlot } from "../src/lib/time";
import { generateInternalAuthEmail } from "../src/lib/validators";

dotenv.config();

const prisma = new PrismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Helper to idempotently get or create a Supabase Auth user
async function getOrCreateAuthUser(params: {
  email: string;
  password?: string;
  name: string;
}): Promise<string> {
  const password = params.password || "Password@123";

  // Check if user exists by listing (paging if needed)
  const { data: listData } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 100,
  });

  const existing = listData?.users?.find(
    (u) => u.email?.toLowerCase() === params.email.toLowerCase()
  );

  if (existing) {
    // Ensure password matches for demo repeatability
    await supabaseAdmin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { name: params.name },
    });
    return existing.id;
  }

  // Create confirmed user
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: params.email,
    password,
    email_confirm: true,
    user_metadata: { name: params.name },
  });

  if (error || !data.user) {
    throw new Error(`Failed to create auth user ${params.email}: ${error?.message}`);
  }

  return data.user.id;
}

async function main() {
  console.log("\n🌱 Starting Smriti Backend Seed Process (Idempotent)...\n");

  // ===========================================================================
  // 1. DOCTOR: Dr. Anjali Mehta
  // ===========================================================================
  console.log("Creating Doctor: Dr. Anjali Mehta...");
  const docEmail = "dr.anjali@smriti.app";
  const docAuthId = await getOrCreateAuthUser({
    email: docEmail,
    name: "Dr. Anjali Mehta",
  });

  const doctor = await prisma.user.upsert({
    where: { id: docAuthId },
    update: {
      name: "Dr. Anjali Mehta",
      email: docEmail,
      authEmail: docEmail,
      hasRealEmail: true,
      phone: "+919820011223",
      role: Role.DOCTOR,
      language: "en",
      isActive: true,
      mustChangePassword: false,
    },
    create: {
      id: docAuthId,
      name: "Dr. Anjali Mehta",
      email: docEmail,
      authEmail: docEmail,
      hasRealEmail: true,
      phone: "+919820011223",
      role: Role.DOCTOR,
      language: "en",
      isActive: true,
      mustChangePassword: false,
    },
  });

  await prisma.doctorProfile.upsert({
    where: { userId: doctor.id },
    update: {
      specialization: "Geriatric Medicine & Internal Health",
      registrationNumber: "MCI-2012-88741",
      clinicName: "Mehta Geriatric & Elder Care Centre, Mumbai",
    },
    create: {
      userId: doctor.id,
      specialization: "Geriatric Medicine & Internal Health",
      registrationNumber: "MCI-2012-88741",
      clinicName: "Mehta Geriatric & Elder Care Centre, Mumbai",
    },
  });

  // ===========================================================================
  // 2. CARETAKERS (2)
  // ===========================================================================
  console.log("Creating Caretakers: Pooja Sawant and Rajesh Kumar...");
  const caretaker1AuthId = await getOrCreateAuthUser({
    email: "pooja.sawant@smriti.app",
    name: "Pooja Sawant",
  });
  const caretaker1 = await prisma.user.upsert({
    where: { id: caretaker1AuthId },
    update: {
      name: "Pooja Sawant",
      email: "pooja.sawant@smriti.app",
      authEmail: "pooja.sawant@smriti.app",
      hasRealEmail: true,
      phone: "+919833344551",
      role: Role.CARETAKER,
      language: "mr",
      isActive: true,
    },
    create: {
      id: caretaker1AuthId,
      name: "Pooja Sawant",
      email: "pooja.sawant@smriti.app",
      authEmail: "pooja.sawant@smriti.app",
      hasRealEmail: true,
      phone: "+919833344551",
      role: Role.CARETAKER,
      language: "mr",
      isActive: true,
    },
  });

  const caretaker2AuthId = await getOrCreateAuthUser({
    email: "rajesh.kumar@smriti.app",
    name: "Rajesh Kumar",
  });
  const caretaker2 = await prisma.user.upsert({
    where: { id: caretaker2AuthId },
    update: {
      name: "Rajesh Kumar",
      email: "rajesh.kumar@smriti.app",
      authEmail: "rajesh.kumar@smriti.app",
      hasRealEmail: true,
      phone: "+919833344552",
      role: Role.CARETAKER,
      language: "hi",
      isActive: true,
    },
    create: {
      id: caretaker2AuthId,
      name: "Rajesh Kumar",
      email: "rajesh.kumar@smriti.app",
      authEmail: "rajesh.kumar@smriti.app",
      hasRealEmail: true,
      phone: "+919833344552",
      role: Role.CARETAKER,
      language: "hi",
      isActive: true,
    },
  });

  // ===========================================================================
  // 3. FAMILY MEMBERS (3)
  // ===========================================================================
  console.log("Creating Family Members: Amit Sharma, Priya Kulkarni, Vikram Deshmukh...");
  const fam1AuthId = await getOrCreateAuthUser({
    email: "amit.sharma@gmail.com",
    name: "Amit Sharma",
  });
  const fam1 = await prisma.user.upsert({
    where: { id: fam1AuthId },
    update: {
      name: "Amit Sharma",
      email: "amit.sharma@gmail.com",
      authEmail: "amit.sharma@gmail.com",
      hasRealEmail: true,
      phone: "+919844455661",
      role: Role.FAMILY,
      language: "hi",
      isActive: true,
    },
    create: {
      id: fam1AuthId,
      name: "Amit Sharma",
      email: "amit.sharma@gmail.com",
      authEmail: "amit.sharma@gmail.com",
      hasRealEmail: true,
      phone: "+919844455661",
      role: Role.FAMILY,
      language: "hi",
      isActive: true,
    },
  });

  const fam2AuthId = await getOrCreateAuthUser({
    email: "priya.kulkarni@gmail.com",
    name: "Priya Kulkarni",
  });
  const fam2 = await prisma.user.upsert({
    where: { id: fam2AuthId },
    update: {
      name: "Priya Kulkarni",
      email: "priya.kulkarni@gmail.com",
      authEmail: "priya.kulkarni@gmail.com",
      hasRealEmail: true,
      phone: "+919844455662",
      role: Role.FAMILY,
      language: "mr",
      isActive: true,
    },
    create: {
      id: fam2AuthId,
      name: "Priya Kulkarni",
      email: "priya.kulkarni@gmail.com",
      authEmail: "priya.kulkarni@gmail.com",
      hasRealEmail: true,
      phone: "+919844455662",
      role: Role.FAMILY,
      language: "mr",
      isActive: true,
    },
  });

  const fam3AuthId = await getOrCreateAuthUser({
    email: "vikram.deshmukh@gmail.com",
    name: "Vikram Deshmukh",
  });
  const fam3 = await prisma.user.upsert({
    where: { id: fam3AuthId },
    update: {
      name: "Vikram Deshmukh",
      email: "vikram.deshmukh@gmail.com",
      authEmail: "vikram.deshmukh@gmail.com",
      hasRealEmail: true,
      phone: "+919844455663",
      role: Role.FAMILY,
      language: "mr",
      isActive: true,
    },
    create: {
      id: fam3AuthId,
      name: "Vikram Deshmukh",
      email: "vikram.deshmukh@gmail.com",
      authEmail: "vikram.deshmukh@gmail.com",
      hasRealEmail: true,
      phone: "+919844455663",
      role: Role.FAMILY,
      language: "mr",
      isActive: true,
    },
  });

  // ===========================================================================
  // 4. ELDERS (8 elders: realistic names, mix of hi/mr, phone-only elders)
  // ===========================================================================
  console.log("Creating 8 Elders (mix of Hindi/Marathi & phone-only accounts)...");

  interface ElderSeedConfig {
    name: string;
    email?: string;
    phone: string;
    language: string;
    gender: string;
    bloodGroup: string;
    medicalConditions: string;
    allergies: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    adherenceProfile: "EXCELLENT" | "GOOD" | "POOR";
    caretaker?: string; // id
    family?: string; // id
  }

  const elderConfigs: ElderSeedConfig[] = [
    {
      name: "Ramesh Sharma",
      email: "ramesh.sharma@gmail.com",
      phone: "+919811122331",
      language: "hi",
      gender: "Male",
      bloodGroup: "O+",
      medicalConditions: "Type 2 Diabetes, Hypertension, Mild Osteoarthritis",
      allergies: "Sulfa drugs",
      emergencyContactName: "Amit Sharma (Son)",
      emergencyContactPhone: "+919844455661",
      adherenceProfile: "EXCELLENT",
      caretaker: caretaker2.id,
      family: fam1.id,
    },
    {
      name: "Kamla Devi",
      phone: "+919811122332", // Phone-only
      language: "hi",
      gender: "Female",
      bloodGroup: "B+",
      medicalConditions: "Hypertension, Osteoporosis",
      allergies: "None",
      emergencyContactName: "Amit Sharma",
      emergencyContactPhone: "+919844455661",
      adherenceProfile: "GOOD",
      caretaker: caretaker2.id,
      family: fam1.id,
    },
    {
      name: "Suresh Kulkarni",
      email: "suresh.kulkarni@gmail.com",
      phone: "+919811122333",
      language: "mr",
      gender: "Male",
      bloodGroup: "A+",
      medicalConditions: "Coronary Artery Disease, Dyslipidemia, Mild Memory Loss",
      allergies: "Aspirin high-dose causes gastritis",
      emergencyContactName: "Priya Kulkarni (Daughter)",
      emergencyContactPhone: "+919844455662",
      adherenceProfile: "POOR", // 45% adherence - prime demo case for Doctor dashboard & AI brief
      caretaker: caretaker1.id,
      family: fam2.id,
    },
    {
      name: "Shantabai Deshmukh",
      phone: "+919811122334", // Phone-only
      language: "mr",
      gender: "Female",
      bloodGroup: "AB+",
      medicalConditions: "Hypothyroidism, Type 2 Diabetes",
      allergies: "Penicillin",
      emergencyContactName: "Vikram Deshmukh (Son)",
      emergencyContactPhone: "+919844455663",
      adherenceProfile: "POOR", // 35% adherence - frequent missed evening doses
      caretaker: caretaker1.id,
      family: fam3.id,
    },
    {
      name: "Harish Patel",
      email: "harish.patel@gmail.com",
      phone: "+919811122335",
      language: "hi",
      gender: "Male",
      bloodGroup: "O-",
      medicalConditions: "Chronic Kidney Disease Stage 2, Hypertension",
      allergies: "None",
      emergencyContactName: "Nitin Patel",
      emergencyContactPhone: "+919844455664",
      adherenceProfile: "GOOD",
      caretaker: caretaker2.id,
    },
    {
      name: "Parvati Joshi",
      email: "parvati.joshi@gmail.com",
      phone: "+919811122336",
      language: "mr",
      gender: "Female",
      bloodGroup: "B-",
      medicalConditions: "Bronchial Asthma, Hypertension",
      allergies: "Dust, NSAIDs",
      emergencyContactName: "Anil Joshi",
      emergencyContactPhone: "+919844455665",
      adherenceProfile: "EXCELLENT",
      caretaker: caretaker1.id,
    },
    {
      name: "Dinanath Verma",
      phone: "+919811122337", // Phone-only
      language: "hi",
      gender: "Male",
      bloodGroup: "A-",
      medicalConditions: "Post-Stroke Recovery, Hypertension, Mild Tremors",
      allergies: "None",
      emergencyContactName: "Sunil Verma",
      emergencyContactPhone: "+919844455666",
      adherenceProfile: "POOR", // 50% adherence
    },
    {
      name: "Laxman Rao",
      email: "laxman.rao@gmail.com",
      phone: "+919811122338",
      language: "mr",
      gender: "Male",
      bloodGroup: "O+",
      medicalConditions: "Benign Prostatic Hyperplasia, Hypertension",
      allergies: "None",
      emergencyContactName: "Mahesh Rao",
      emergencyContactPhone: "+919844455667",
      adherenceProfile: "EXCELLENT",
    },
  ];

  const createdElders: Array<{ user: any; profile: any; adherence: string }> = [];

  for (const cfg of elderConfigs) {
    const hasRealEmail = Boolean(cfg.email);
    const authEmail = hasRealEmail ? cfg.email! : generateInternalAuthEmail(cfg.phone);

    const authId = await getOrCreateAuthUser({
      email: authEmail,
      name: cfg.name,
    });

    const elderUser = await prisma.user.upsert({
      where: { id: authId },
      update: {
        name: cfg.name,
        email: cfg.email ?? null,
        authEmail,
        hasRealEmail,
        phone: cfg.phone,
        role: Role.ELDER,
        language: cfg.language,
        isActive: true,
      },
      create: {
        id: authId,
        name: cfg.name,
        email: cfg.email ?? null,
        authEmail,
        hasRealEmail,
        phone: cfg.phone,
        role: Role.ELDER,
        language: cfg.language,
        isActive: true,
      },
    });

    const elderProf = await prisma.elderProfile.upsert({
      where: { userId: elderUser.id },
      update: {
        gender: cfg.gender,
        bloodGroup: cfg.bloodGroup,
        medicalConditions: cfg.medicalConditions,
        allergies: cfg.allergies,
        emergencyContactName: cfg.emergencyContactName,
        emergencyContactPhone: cfg.emergencyContactPhone,
        timezone: "Asia/Kolkata",
        largeTextMode: true,
        voiceReminders: cfg.adherenceProfile === "POOR",
        createdByDoctorId: doctor.id,
      },
      create: {
        userId: elderUser.id,
        gender: cfg.gender,
        bloodGroup: cfg.bloodGroup,
        medicalConditions: cfg.medicalConditions,
        allergies: cfg.allergies,
        emergencyContactName: cfg.emergencyContactName,
        emergencyContactPhone: cfg.emergencyContactPhone,
        timezone: "Asia/Kolkata",
        largeTextMode: true,
        voiceReminders: cfg.adherenceProfile === "POOR",
        createdByDoctorId: doctor.id,
      },
    });

    // 1. Link Doctor to Elder
    await prisma.elderAccess.upsert({
      where: {
        elderId_memberId: {
          elderId: elderUser.id,
          memberId: doctor.id,
        },
      },
      update: { status: AccessStatus.ACTIVE, role: Role.DOCTOR },
      create: {
        elderId: elderUser.id,
        memberId: doctor.id,
        role: Role.DOCTOR,
        status: AccessStatus.ACTIVE,
      },
    });

    // 2. Link Caretaker if assigned
    if (cfg.caretaker) {
      await prisma.elderAccess.upsert({
        where: {
          elderId_memberId: {
            elderId: elderUser.id,
            memberId: cfg.caretaker,
          },
        },
        update: { status: AccessStatus.ACTIVE, role: Role.CARETAKER },
        create: {
          elderId: elderUser.id,
          memberId: cfg.caretaker,
          role: Role.CARETAKER,
          status: AccessStatus.ACTIVE,
        },
      });
    }

    // 3. Link Family if assigned
    if (cfg.family) {
      await prisma.elderAccess.upsert({
        where: {
          elderId_memberId: {
            elderId: elderUser.id,
            memberId: cfg.family,
          },
        },
        update: { status: AccessStatus.ACTIVE, role: Role.FAMILY },
        create: {
          elderId: elderUser.id,
          memberId: cfg.family,
          role: Role.FAMILY,
          status: AccessStatus.ACTIVE,
        },
      });
    }

    createdElders.push({
      user: elderUser,
      profile: elderProf,
      adherence: cfg.adherenceProfile,
    });
  }

  // ===========================================================================
  // 5. MEDICINES & SCHEDULES
  // ===========================================================================
  console.log("Seeding realistic medications with Hindi/Marathi local names & schedules...");

  const medTemplates = [
    {
      name: "Metformin 500 mg",
      nameLocal: "मेटफॉर्मिन 500 मिलीग्राम",
      genericName: "Metformin Hydrochloride",
      dosage: "500 mg",
      form: MedicineForm.TABLET,
      foodRelation: FoodRelation.AFTER_FOOD,
      instructions: "भोजन के तुरंत बाद 1 गोली पानी के साथ लें। Take 1 tablet with water immediately after meals.",
      warnings: "खाली पेट कभी न लें। चक्कर आने पर तुरंत मीठा खाएं।",
      stockCount: 60,
      refillThreshold: 10,
      schedules: [
        { timeOfDay: "08:30", doseQuantity: "1 tablet" },
        { timeOfDay: "20:30", doseQuantity: "1 tablet" },
      ],
    },
    {
      name: "Amlodipine 5 mg",
      nameLocal: "एम्लोडिपिन 5 मिलीग्राम",
      genericName: "Amlodipine Besylate",
      dosage: "5 mg",
      form: MedicineForm.TABLET,
      foodRelation: FoodRelation.AFTER_FOOD,
      instructions: "रक्तचाप सामान्य रखने के लिए सुबह नाश्ते के बाद लें। For blood pressure maintenance.",
      warnings: "दवा लेना अचानक बंद न करें। पैरों में सूजन दिखे तो डॉक्टर को बताएं।",
      stockCount: 30,
      refillThreshold: 7,
      schedules: [{ timeOfDay: "09:00", doseQuantity: "1 tablet" }],
    },
    {
      name: "Atorvastatin 20 mg",
      nameLocal: "एटोरवास्टेटिन 20 मिलीग्राम",
      genericName: "Atorvastatin Calcium",
      dosage: "20 mg",
      form: MedicineForm.TABLET,
      foodRelation: FoodRelation.AFTER_FOOD,
      instructions: "कोलेस्ट्रॉल कम करने हेतु रात को भोजन के बाद लें। Take at bedtime.",
      warnings: "अंगूर (grapefruit) के साथ यह दवा न लें। मांसपेशियों में दर्द होने पर सूचित करें।",
      stockCount: 30,
      refillThreshold: 5,
      schedules: [{ timeOfDay: "21:30", doseQuantity: "1 tablet" }],
    },
    {
      name: "Ecosprin 75 mg",
      nameLocal: "इकोस्प्रिन 75 मिलीग्राम",
      genericName: "Aspirin Enteric Coated",
      dosage: "75 mg",
      form: MedicineForm.CAPSULE,
      foodRelation: FoodRelation.AFTER_FOOD,
      instructions: "दिल और रक्त संचार की सुरक्षा हेतु दोपहर के खाने के बाद लें।",
      warnings: "पेट में जलन या अल्सर की समस्या होने पर तुरंत डॉक्टर से परामर्श लें।",
      stockCount: 45,
      refillThreshold: 10,
      schedules: [{ timeOfDay: "13:30", doseQuantity: "1 capsule" }],
    },
    {
      name: "Thyronorm 50 mcg",
      nameLocal: "थायरोनॉर्म 50 माइक्रोग्राम",
      genericName: "Levothyroxine Sodium",
      dosage: "50 mcg",
      form: MedicineForm.TABLET,
      foodRelation: FoodRelation.BEFORE_FOOD,
      instructions: "सुबह उठते ही खाली पेट 1 गोली पानी के साथ लें। 30 मिनट तक चाय/कॉफी न लें।",
      warnings: "नाश्ते या दूध के साथ यह दवा न लें।",
      stockCount: 50,
      refillThreshold: 10,
      schedules: [{ timeOfDay: "06:30", doseQuantity: "1 tablet" }],
    },
  ];

  const now = new Date();
  const startDate = subDays(now, 30);

  // For each elder, assign 2 to 4 medicines with schedules
  const allCreatedSchedules: Array<{
    schedule: any;
    medicine: any;
    elderId: string;
    adherence: string;
  }> = [];

  for (let i = 0; i < createdElders.length; i++) {
    const elder = createdElders[i];
    // Select templates for this elder
    const templates = [
      medTemplates[0], // Metformin
      medTemplates[1], // Amlodipine
      ...(i % 2 === 0 ? [medTemplates[2]] : []), // Atorvastatin
      ...(i % 3 === 0 ? [medTemplates[3]] : []), // Ecosprin
      ...(i % 4 === 0 ? [medTemplates[4]] : []), // Thyronorm
    ];

    for (const tpl of templates) {
      // Find or create medicine
      let med = await prisma.medicine.findFirst({
        where: { elderId: elder.user.id, name: tpl.name },
      });

      if (!med) {
        med = await prisma.medicine.create({
          data: {
            elderId: elder.user.id,
            prescribedById: doctor.id,
            name: tpl.name,
            nameLocal: tpl.nameLocal,
            genericName: tpl.genericName,
            dosage: tpl.dosage,
            form: tpl.form,
            foodRelation: tpl.foodRelation,
            instructions: tpl.instructions,
            warnings: tpl.warnings,
            startDate,
            stockCount: tpl.stockCount,
            refillThreshold: tpl.refillThreshold,
            status: MedicineStatus.ACTIVE,
          },
        });
      }

      for (const s of tpl.schedules) {
        let schedule = await prisma.medicineSchedule.findFirst({
          where: { medicineId: med.id, timeOfDay: s.timeOfDay },
        });

        if (!schedule) {
          schedule = await prisma.medicineSchedule.create({
            data: {
              medicineId: med.id,
              timeOfDay: s.timeOfDay,
              slot: deriveTimeSlot(s.timeOfDay),
              daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
              doseQuantity: s.doseQuantity,
              graceMinutes: 30,
              isActive: true,
            },
          });
        }

        allCreatedSchedules.push({
          schedule,
          medicine: med,
          elderId: elder.user.id,
          adherence: elder.adherence,
        });
      }
    }
  }

  // ===========================================================================
  // 6. HISTORICAL DOSE LOGS (Past 7 Days: days -7 to -1)
  // ===========================================================================
  console.log("Seeding 7 days of realistic DoseLog history (high vs poor adherence)...");

  for (let dayOffset = 7; dayOffset >= 1; dayOffset--) {
    const historicalDay = subDays(now, dayOffset);
    const dateStr = formatInTimeZone(historicalDay, "Asia/Kolkata", "yyyy-MM-dd");

    for (const item of allCreatedSchedules) {
      const scheduledFor = fromZonedTime(
        `${dateStr}T${item.schedule.timeOfDay}:00`,
        "Asia/Kolkata"
      );

      let status: DoseStatus = DoseStatus.TAKEN;
      let markedByRole: Role | null = Role.ELDER;
      let markedById: string | null = item.elderId;
      let escalationLevel = 0;
      let note: string | null = null;

      if (item.adherence === "EXCELLENT") {
        status = DoseStatus.TAKEN;
      } else if (item.adherence === "GOOD") {
        // 90% taken, 10% taken late or given by caretaker
        if (dayOffset % 4 === 0) {
          status = DoseStatus.GIVEN;
          markedByRole = Role.CARETAKER;
          markedById = caretaker2.id;
        } else {
          status = DoseStatus.TAKEN;
        }
      } else if (item.adherence === "POOR") {
        // Poor adherence: 40-50% MISSED
        if (dayOffset % 2 === 0 || item.schedule.timeOfDay === "20:30" || item.schedule.timeOfDay === "21:30") {
          status = DoseStatus.MISSED;
          markedByRole = null;
          markedById = null;
          escalationLevel = 2; // Family notified
          note = "Evening dose missed. Elder slept early without medication.";
        } else {
          status = DoseStatus.TAKEN;
        }
      }

      await prisma.doseLog.upsert({
        where: {
          scheduleId_scheduledFor: {
            scheduleId: item.schedule.id,
            scheduledFor,
          },
        },
        update: {
          status,
          markedByRole,
          markedById,
          markedAt: status !== DoseStatus.MISSED ? scheduledFor : null,
          escalationLevel,
          note,
        },
        create: {
          scheduleId: item.schedule.id,
          medicineId: item.medicine.id,
          elderId: item.elderId,
          scheduledFor,
          status,
          markedByRole,
          markedById,
          markedAt: status !== DoseStatus.MISSED ? scheduledFor : null,
          escalationLevel,
          note,
        },
      });
    }
  }

  // ===========================================================================
  // 7. UPCOMING APPOINTMENTS
  // ===========================================================================
  console.log("Seeding upcoming doctor appointments...");

  const appointmentData = [
    {
      elderId: createdElders[0].user.id, // Ramesh Sharma
      title: "Quarterly Hypertension & Diabetes Review",
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // +3 days
      location: "Mehta Geriatric Clinic, Suite 302, Bandra West, Mumbai",
      notes: "Check HbA1c and lipid profile. Bring recent home BP logs.",
    },
    {
      elderId: createdElders[2].user.id, // Suresh Kulkarni (Poor adherence)
      title: "Urgent Medication Adherence & Cardiac Follow-up",
      scheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // +5 days
      location: "Mehta Geriatric Clinic, Suite 302, Bandra West, Mumbai",
      notes: "Discuss missed doses with daughter Priya. Assess blood pressure stability.",
    },
    {
      elderId: createdElders[1].user.id, // Kamla Devi
      title: "Joint Pain & Bone Mineral Density Consultation",
      scheduledAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // +10 days
      location: "Mehta Geriatric Clinic, Suite 302, Bandra West, Mumbai",
      notes: "Evaluate knee joint mobility and calcium supplementation.",
    },
  ];

  for (const app of appointmentData) {
    const existing = await prisma.appointment.findFirst({
      where: { elderId: app.elderId, title: app.title },
    });

    if (!existing) {
      await prisma.appointment.create({
        data: {
          elderId: app.elderId,
          doctorId: doctor.id,
          createdById: doctor.id,
          title: app.title,
          scheduledAt: app.scheduledAt,
          location: app.location,
          notes: app.notes,
          status: AppointmentStatus.SCHEDULED,
        },
      });
    }
  }

  // ===========================================================================
  // 8. UNUSED FRESH INVITE CODES (For interactive Postman testing)
  // ===========================================================================
  console.log("Generating fresh unused invite codes for testing...");

  const freshCode1 = "K7QD-9M2X";
  const freshCode2 = "P4BN-8H3W";
  const inviteExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);

  await prisma.inviteCode.upsert({
    where: { code: freshCode1 },
    update: {
      usedAt: null,
      usedById: null,
      revokedAt: null,
      expiresAt: inviteExpiry,
    },
    create: {
      code: freshCode1,
      elderId: createdElders[0].user.id, // Ramesh Sharma
      createdById: createdElders[0].user.id,
      intendedRole: Role.FAMILY,
      expiresAt: inviteExpiry,
    },
  });

  await prisma.inviteCode.upsert({
    where: { code: freshCode2 },
    update: {
      usedAt: null,
      usedById: null,
      revokedAt: null,
      expiresAt: inviteExpiry,
    },
    create: {
      code: freshCode2,
      elderId: createdElders[2].user.id, // Suresh Kulkarni
      createdById: createdElders[2].user.id,
      intendedRole: Role.CARETAKER,
      expiresAt: inviteExpiry,
    },
  });

  // ===========================================================================
  // 9. STAGE 2: CARETAKER NOTES (URGENT & UNSEEN)
  // ===========================================================================
  console.log("Seeding realistic caretaker clinical notes...");

  const sureshElder = createdElders[2].user;
  const shantabaiElder = createdElders[3].user;
  const rameshElder = createdElders[0].user;

  // 1. URGENT note from Pooja for Suresh Kulkarni (Unseen by doctor)
  const existingUrgentNote = await prisma.caretakerNote.findFirst({
    where: { elderId: sureshElder.id, severity: "URGENT" },
  });
  if (!existingUrgentNote) {
    await prisma.caretakerNote.create({
      data: {
        elderId: sureshElder.id,
        authorId: caretaker1.id,
        severity: "URGENT",
        text: "सुरेश जींना चक्कर येत आहे आणि सकाळचे औषध घेतल्यावर मळमळ होत असल्याची तक्रार केली. बीपी 155/95 नोंदवला आहे. तत्काळ लक्ष द्यावे.",
        doctorSeenAt: null, // Unseen
      },
    });
  }

  // 2. WARNING note from Pooja for Shantabai (Unseen by doctor)
  const existingWarnNote = await prisma.caretakerNote.findFirst({
    where: { elderId: shantabaiElder.id, severity: "WARNING" },
  });
  if (!existingWarnNote) {
    await prisma.caretakerNote.create({
      data: {
        elderId: shantabaiElder.id,
        authorId: caretaker1.id,
        severity: "WARNING",
        text: "शांताबाईंनी संध्याकाळचे जेवण खूप उशिरा घेतले. झोपेतून उठताना पायात गोळे येत असल्याचे सांगितले.",
        doctorSeenAt: null, // Unseen
      },
    });
  }

  // 3. INFO note from Rajesh for Ramesh Sharma (Seen by doctor)
  const existingInfoNote = await prisma.caretakerNote.findFirst({
    where: { elderId: rameshElder.id, severity: "INFO" },
  });
  if (!existingInfoNote) {
    await prisma.caretakerNote.create({
      data: {
        elderId: rameshElder.id,
        authorId: caretaker2.id,
        severity: "INFO",
        text: "रमेश जी का शुगर लेवल आज सुबह सामान्य रहा (Fasting: 112 mg/dL)। नाश्ता समय पर लिया।",
        doctorSeenAt: new Date(), // Seen
      },
    });
  }

  // ===========================================================================
  // 10. STAGE 2: LOW STOCK ON 2 MEDICINES
  // ===========================================================================
  console.log("Setting low medicine stock for Suresh and Shantabai...");
  const sureshMeds = await prisma.medicine.findMany({ where: { elderId: sureshElder.id } });
  if (sureshMeds.length > 0) {
    await prisma.medicine.update({
      where: { id: sureshMeds[0].id },
      data: { stockCount: 4, refillThreshold: 10 },
    });
  }

  const shantabaiMeds = await prisma.medicine.findMany({ where: { elderId: shantabaiElder.id } });
  if (shantabaiMeds.length > 0) {
    await prisma.medicine.update({
      where: { id: shantabaiMeds[0].id },
      data: { stockCount: 2, refillThreshold: 7 },
    });
  }

  // ===========================================================================
  // 11. STAGE 2: 3-DAY MISS STREAK & TODAY'S DOSES IN MIXED STATES
  // ===========================================================================
  console.log("Configuring 3-day miss streak and today's mixed-state dose logs...");

  // For Suresh Kulkarni, ensure past 3 schedules are marked MISSED
  const sureshSchedules = await prisma.medicineSchedule.findMany({
    where: { medicine: { elderId: sureshElder.id } },
  });

  const todayStr = formatInTimeZone(now, "Asia/Kolkata", "yyyy-MM-dd");

  for (let sIdx = 0; sIdx < sureshSchedules.length; sIdx++) {
    const s = sureshSchedules[sIdx];
    const schedDate = fromZonedTime(`${todayStr}T${s.timeOfDay}:00`, "Asia/Kolkata");

    // Morning missed, evening pending
    const status = s.timeOfDay.startsWith("0") ? DoseStatus.MISSED : DoseStatus.PENDING;

    await prisma.doseLog.upsert({
      where: {
        scheduleId_scheduledFor: {
          scheduleId: s.id,
          scheduledFor: schedDate,
        },
      },
      update: {
        status,
        escalationLevel: status === DoseStatus.MISSED ? 3 : 0,
        note: status === DoseStatus.MISSED ? "Elder skipped breakfast dose due to nausea." : null,
      },
      create: {
        scheduleId: s.id,
        medicineId: s.medicineId,
        elderId: sureshElder.id,
        scheduledFor: schedDate,
        status,
        escalationLevel: status === DoseStatus.MISSED ? 3 : 0,
        note: status === DoseStatus.MISSED ? "Elder skipped breakfast dose due to nausea." : null,
      },
    });
  }

  // ===========================================================================
  // 12. STAGE 2: UNREAD IN-APP NOTIFICATIONS
  // ===========================================================================
  console.log("Seeding unread in-app notifications...");

  // Doctor notification for Suresh's urgent note
  await prisma.notification.upsert({
    where: { userId_dedupeKey: { userId: doctor.id, dedupeKey: "seed:urgent:suresh" } },
    update: {},
    create: {
      userId: doctor.id,
      elderId: sureshElder.id,
      type: "CARETAKER_NOTE",
      title: "अत्यावश्यक केयरटेकर अलर्ट: Suresh Kulkarni",
      body: "Pooja Sawant द्वारा Suresh Kulkarni जी के लिए अत्यावश्यक सूचना: 'सुरेश जींना चक्कर येत आहे आणि सकाळचे औषध घेतल्यावर मळमळ होत असल्याची तक्रार केली. बीपी 155/95 नोंदवला आहे.'",
      dedupeKey: "seed:urgent:suresh",
      data: { templateKey: "caretaker_note_urgent" },
      readAt: null,
    },
  });

  // Family notification for Priya Kulkarni
  await prisma.notification.upsert({
    where: { userId_dedupeKey: { userId: fam2.id, dedupeKey: "seed:missed:suresh:priya" } },
    update: {},
    create: {
      userId: fam2.id,
      elderId: sureshElder.id,
      type: "MISSED_DOSE",
      title: "तात्काळ सूचना: Suresh Kulkarni यांचे औषध चुकले",
      body: "Suresh Kulkarni यांचे सकाळचे औषध (Metformin 500 mg) सुटले आहे. कृपया त्वरित त्यांच्याशी किंवा केअरटेकरशी संपर्क साधा.",
      dedupeKey: "seed:missed:suresh:priya",
      data: { templateKey: "dose_missed" },
      readAt: null,
    },
  });

  // ===========================================================================
  // PRINT CREDENTIALS & DEMO ACCESS SUMMARY
  // ===========================================================================
  console.log("\n==================================================================");
  console.log("🎉 SMRITI PLATFORM SEED COMPLETED SUCCESSFULLY!");
  console.log("==================================================================");
  console.log("All accounts share standard demo password: Password@123\n");

  console.log("👨‍⚕️ DOCTOR ACCOUNT:");
  console.log(`   Email:    dr.anjali@smriti.app`);
  console.log(`   Phone:    +919820011223`);
  console.log(`   Password: Password@123`);
  console.log(`   Role:     DOCTOR\n`);

  console.log("👵 ELDER ACCOUNTS (8):");
  for (let i = 0; i < createdElders.length; i++) {
    const e = createdElders[i];
    const emailStr = e.user.hasRealEmail ? e.user.email : `[Phone-Only Auth: ${e.user.authEmail}]`;
    console.log(
      `   ${i + 1}. ${e.user.name.padEnd(20)} | Phone: ${e.user.phone.padEnd(14)} | Lang: ${e.user.language} | Adherence: ${e.adherence.padEnd(9)} | Contact: ${emailStr}`
    );
  }

  console.log("\n🤝 CARETAKER ACCOUNTS (2):");
  console.log(`   1. Pooja Sawant (mr):  pooja.sawant@smriti.app  | +919833344551`);
  console.log(`   2. Rajesh Kumar (hi):  rajesh.kumar@smriti.app  | +919833344552`);

  console.log("\n👨‍👩‍👧 FAMILY MEMBER ACCOUNTS (3):");
  console.log(`   1. Amit Sharma (hi):     amit.sharma@gmail.com    | +919844455661 (Linked to Ramesh & Kamla)`);
  console.log(`   2. Priya Kulkarni (mr):  priya.kulkarni@gmail.com | +919844455662 (Linked to Suresh)`);
  console.log(`   3. Vikram Deshmukh (mr): vikram.deshmukh@gmail.com| +919844455663 (Linked to Shantabai)`);

  console.log("\n🎟️ FRESH UNUSED INVITE CODES (Valid for 48 hours):");
  console.log(`   Code 1: ${freshCode1} -> Intended Role: FAMILY (Elder: Ramesh Sharma)`);
  console.log(`   Code 2: ${freshCode2} -> Intended Role: CARETAKER (Elder: Suresh Kulkarni)`);

  console.log("\n📋 STAGE 2 DEMO SCRIPT (curl commands):");
  console.log(`   1. Doctor Dashboard:   curl -H "Authorization: Bearer <DOC_TOKEN>" http://localhost:3000/api/doctor/dashboard`);
  console.log(`   2. AI Daily Brief:     curl -H "Authorization: Bearer <DOC_TOKEN>" http://localhost:3000/api/doctor/brief`);
  console.log(`   3. Adherence 7-Day:    curl -H "Authorization: Bearer <DOC_TOKEN>" http://localhost:3000/api/elders/${sureshElder.id}/adherence?days=7`);
  console.log(`   4. Cron Tick (sim):    curl -H "Authorization: Bearer smriti-super-secret-cron-token-min-32-chars-long" http://localhost:3000/api/cron/tick`);
  console.log("==================================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
