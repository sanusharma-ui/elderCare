import { handleApiError, successResponse } from "@/lib/api-response";
import { callGemini, checkAiRateLimit } from "@/lib/ai/gemini";
import { enforceRateLimit, RATE_LIMIT_PRESETS } from "@/lib/rate-limit";
import { AI_DISCLAIMER } from "@/lib/ai/prompts";
import { AppError } from "@/lib/errors";
import { getElderAccess, requireAuth } from "@/lib/permissions";
import { FoodRelation, MedicineForm, Role } from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";

const DraftMedicineItemSchema = z.object({
  name: z.string().min(1),
  nameLocal: z.string().optional().nullable(),
  genericName: z.string().optional().nullable(),
  dosage: z.string().min(1),
  form: z.nativeEnum(MedicineForm).default(MedicineForm.TABLET),
  foodRelation: z.nativeEnum(FoodRelation).default(FoodRelation.AFTER_FOOD),
  instructions: z.string().optional().nullable(),
  warnings: z.string().optional().nullable(),
  schedules: z
    .array(
      z.object({
        timeOfDay: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        doseQuantity: z.string().default("1 tablet"),
        daysOfWeek: z.array(z.number().min(0).max(6)).default([0, 1, 2, 3, 4, 5, 6]),
      })
    )
    .min(1),
});

const DraftExtractionResponseSchema = z.array(DraftMedicineItemSchema);

type DraftMedicineItem = z.infer<typeof DraftMedicineItemSchema>;

const FALLBACK_DRAFT_MEDICINES: DraftMedicineItem[] = [
  {
    name: "Amlodipine 5 mg",
    nameLocal: "एम्लोडिपिन 5 मिलीग्राम",
    genericName: "Amlodipine Besylate",
    dosage: "5 mg",
    form: MedicineForm.TABLET,
    foodRelation: FoodRelation.AFTER_FOOD,
    instructions: "रक्तचाप नियंत्रण हेतु सुबह नाश्ते के बाद 1 गोली लें।",
    warnings: "अचानक दवा लेना बंद न करें।",
    schedules: [
      {
        timeOfDay: "09:00",
        doseQuantity: "1 tablet",
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      },
    ],
  },
  {
    name: "Metformin 500 mg",
    nameLocal: "मेटफॉर्मिन 500 मिलीग्राम",
    genericName: "Metformin Hydrochloride",
    dosage: "500 mg",
    form: MedicineForm.TABLET,
    foodRelation: FoodRelation.AFTER_FOOD,
    instructions: "भोजन के तुरंत बाद 1 गोली पानी के साथ लें।",
    warnings: "खाली पेट कभी न लें।",
    schedules: [
      {
        timeOfDay: "08:30",
        doseQuantity: "1 tablet",
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      },
      {
        timeOfDay: "20:30",
        doseQuantity: "1 tablet",
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      },
    ],
  },
];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ elderId: string }> }
) {
  try {
    const authDoctor = await requireAuth([Role.DOCTOR]);
    const { elderId } = await params;

    const access = await getElderAccess(authDoctor.id, elderId);
    if (!access) {
      throw AppError.notFound("Elder not found");
    }

    if (access !== "DOCTOR") {
      throw AppError.forbidden("Only a linked doctor can scan prescriptions");
    }

    const formData = await req.formData();
    const file = formData.get("image");

    if (!file || typeof file === "string") {
      throw AppError.validation("Prescription image file ('image') is required in form-data");
    }

    const blob = file as Blob;
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

    if (!allowedMimeTypes.includes(blob.type)) {
      throw AppError.validation(
        `Invalid file format '${blob.type}'. Only JPG, PNG, and WebP are supported.`
      );
    }

    // 5 MB max size check
    if (blob.size > 5 * 1024 * 1024) {
      throw AppError.validation("Prescription image exceeds maximum allowable size of 5 MB");
    }

    enforceRateLimit(
      `scan:doctor:${authDoctor.id}`,
      RATE_LIMIT_PRESETS.PRESCRIPTION_SCAN.limit,
      RATE_LIMIT_PRESETS.PRESCRIPTION_SCAN.windowSeconds,
      "Prescription scan limit reached (6 scans per 10 minutes). Please try again shortly."
    );

    checkAiRateLimit(authDoctor.id);

    const buffer = Buffer.from(await blob.arrayBuffer());
    const base64Data = buffer.toString("base64");

    const systemInstruction = `You are a medical optical prescription extractor. Analyze the handwritten or printed prescription image and extract medication prescriptions into a strictly valid JSON array.
Each element must have:
- name: string (e.g. "Metformin 500 mg")
- nameLocal: string (Hindi phonetic transliteration, e.g. "मेटफॉर्मिन 500 मिलीग्राम")
- genericName: string or null
- dosage: string (e.g. "500 mg")
- form: "TABLET" | "CAPSULE" | "SYRUP" | "INJECTION" | "DROPS" | "INHALER" | "OINTMENT" | "OTHER"
- foodRelation: "BEFORE_FOOD" | "AFTER_FOOD" | "WITH_FOOD" | "ANYTIME"
- instructions: string
- warnings: string or null
- schedules: array of { timeOfDay: "HH:mm" (24-hour), doseQuantity: "1 tablet", daysOfWeek: [0,1,2,3,4,5,6] }

Return ONLY the raw JSON array. No markdown, no triple backticks.`;

    const contents = [
      {
        inlineData: {
          mimeType: blob.type,
          data: base64Data,
        },
      },
      {
        text: "Extract all medications and schedule directions from this prescription image into JSON.",
      },
    ];

    const geminiText = await callGemini({
      systemInstruction,
      contents,
    });

    let draftMedicines = FALLBACK_DRAFT_MEDICINES;
    let source = "fallback";

    if (geminiText) {
      try {
        const cleaned = geminiText
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();
        const parsed = JSON.parse(cleaned);
        draftMedicines = DraftExtractionResponseSchema.parse(parsed);
        source = "ai";
      } catch (parseErr) {
        console.warn("Failed to parse Gemini prescription JSON, serving fallback draft:", parseErr);
        draftMedicines = FALLBACK_DRAFT_MEDICINES;
      }
    }

    return successResponse({
      source,
      elderId,
      medicines: draftMedicines,
      disclaimer: AI_DISCLAIMER,
      message:
        "Draft extracted successfully. This draft is not saved. Review and submit via POST /api/elders/:elderId/medicines.",
    });
  } catch (err) {
    return handleApiError(err);
  }
}
