import { calculateDoctorDashboardMetrics, calculateElderAdherence } from "@/lib/analytics";
import { handleApiError, successResponse } from "@/lib/api-response";
import { callGemini, checkAiRateLimit } from "@/lib/ai/gemini";
import { AI_DISCLAIMER } from "@/lib/ai/prompts";
import { AppError } from "@/lib/errors";
import { requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { AccessStatus, DoseStatus, Role } from "@prisma/client";
import { subDays } from "date-fns";
import { NextRequest } from "next/server";
import { z } from "zod";

const AskSchema = z.object({
  question: z.string().min(2, "Question is required").max(500),
});

export async function POST(req: NextRequest) {
  try {
    const authDoctor = await requireAuth([Role.DOCTOR]);
    const rawBody = await req.json();
    const { question } = AskSchema.parse(rawBody);

    checkAiRateLimit(authDoctor.id);

    // 1. Fetch doctor's linked patients to enforce security scope
    const linkedElders = await prisma.elderAccess.findMany({
      where: {
        memberId: authDoctor.id,
        status: AccessStatus.ACTIVE,
      },
      include: {
        elder: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    const elderIds = linkedElders.map((l) => l.elder.id);
    const elderMapByName = new Map<string, string>();
    linkedElders.forEach((l) => {
      elderMapByName.set(l.elder.name.toLowerCase(), l.elder.id);
    });

    // Tool implementations scoped to doctor
    const tools = {
      async countPatientsByStatus() {
        return await calculateDoctorDashboardMetrics(authDoctor.id);
      },
      async listLowAdherencePatients(days: number = 7, threshold: number = 60) {
        const results = [];
        for (const elder of linkedElders) {
          const adh = await calculateElderAdherence(elder.elder.id, days);
          if (adh.overallPercentage !== null && adh.overallPercentage < threshold) {
            results.push({
              name: elder.elder.name,
              adherencePercentage: adh.overallPercentage,
              missedDoses: adh.missedCount,
              currentMissStreak: adh.currentMissStreak,
            });
          }
        }
        return results;
      },
      async getPatientMissedDoses(patientNameQuery: string, days: number = 7) {
        const match = linkedElders.find((l) =>
          l.elder.name.toLowerCase().includes(patientNameQuery.toLowerCase())
        );
        if (!match) return { found: false, message: "Patient not found in your care list" };

        const startDate = subDays(new Date(), days);
        const misses = await prisma.doseLog.findMany({
          where: {
            elderId: match.elder.id,
            status: DoseStatus.MISSED,
            scheduledFor: { gte: startDate },
          },
          include: {
            medicine: { select: { name: true } },
            schedule: { select: { timeOfDay: true, slot: true } },
          },
          orderBy: { scheduledFor: "desc" },
        });

        return {
          found: true,
          patientName: match.elder.name,
          missedCount: misses.length,
          misses: misses.map((m) => ({
            medicine: m.medicine.name,
            scheduledFor: m.scheduledFor,
            slot: m.schedule.slot,
          })),
        };
      },
    };

    // Determine relevant tools from question keyword analysis
    const qLower = question.toLowerCase();
    const toolsUsed: string[] = [];
    let toolContextData: any = null;

    if (qLower.includes("low") || qLower.includes("adherence") || qLower.includes("critical") || qLower.includes("risk")) {
      toolsUsed.push("listLowAdherencePatients");
      toolContextData = await tools.listLowAdherencePatients(7, 85);
    } else if (qLower.includes("count") || qLower.includes("how many") || qLower.includes("dashboard") || qLower.includes("status")) {
      toolsUsed.push("countPatientsByStatus");
      toolContextData = await tools.countPatientsByStatus();
    } else {
      // Check if a patient name is mentioned
      const foundElder = linkedElders.find((l) => qLower.includes(l.elder.name.toLowerCase()));
      if (foundElder) {
        toolsUsed.push("getPatientMissedDoses");
        toolContextData = await tools.getPatientMissedDoses(foundElder.elder.name, 7);
      } else {
        toolsUsed.push("countPatientsByStatus");
        toolContextData = await tools.countPatientsByStatus();
      }
    }

    // Call Gemini with the tool context
    const systemInstruction = `You are CareSaathi Clinical Assistant answering a consulting doctor's question about their linked elderly patients.
Answer concisely in 2 to 4 sentences in the doctor's language (${authDoctor.language}).
Base your answer ONLY on the provided tool data.
Never recommend drug changes or diagnoses.`;

    const promptContents = `Doctor's Question: "${question}"
Retrieved Data: ${JSON.stringify(toolContextData, null, 2)}
Please answer directly and clinically.`;

    const geminiText = await callGemini({
      systemInstruction,
      contents: promptContents,
    });

    const fallbackAnswer = `Based on your linked patients: ${JSON.stringify(
      toolContextData
    ).slice(0, 300)}...`;

    return successResponse({
      answer: geminiText || fallbackAnswer,
      source: geminiText ? "ai" : "fallback",
      toolsUsed,
      toolData: toolContextData,
      disclaimer: AI_DISCLAIMER,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
