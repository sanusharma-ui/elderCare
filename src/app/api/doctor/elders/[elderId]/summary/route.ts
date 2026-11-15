import { calculateElderAdherence } from "@/lib/analytics";
import { handleApiError, successResponse } from "@/lib/api-response";
import { callGemini, checkAiRateLimit } from "@/lib/ai/gemini";
import {
  AI_DISCLAIMER,
  generatePatientSummaryFallback,
  getPatientSummarySystemPrompt,
} from "@/lib/ai/prompts";
import { AppError } from "@/lib/errors";
import { SupportedLanguage } from "@/lib/i18n/messages";
import { getElderAccess, requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { DEFAULT_TIMEZONE, getTodayDateString } from "@/lib/time";
import { Role } from "@prisma/client";
import { fromZonedTime } from "date-fns-tz";
import { NextRequest } from "next/server";

export async function GET(
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
      throw AppError.forbidden("Only a linked doctor can access AI patient summaries");
    }

    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get("refresh") === "1";
    const daysParam = parseInt(searchParams.get("days") || "7", 10);
    const days = isNaN(daysParam) || daysParam <= 0 ? 7 : Math.min(daysParam, 30);

    const todayStr = getTodayDateString(DEFAULT_TIMEZONE);
    const forDate = fromZonedTime(`${todayStr}T00:00:00`, DEFAULT_TIMEZONE);

    if (!forceRefresh) {
      const cached = await prisma.aiPatientSummary.findUnique({
        where: {
          elderId_doctorId_forDate: {
            elderId,
            doctorId: authDoctor.id,
            forDate,
          },
        },
      });

      if (cached) {
        return successResponse({
          elderId,
          forDate: todayStr,
          content: cached.content,
          stats: cached.stats,
          source: "cached",
          disclaimer: AI_DISCLAIMER,
        });
      }
    }

    // Rate limit check
    checkAiRateLimit(authDoctor.id);

    const elder = await prisma.user.findUnique({
      where: { id: elderId },
      select: { name: true, language: true },
    });

    const adherence = await calculateElderAdherence(elderId, days);
    const lang = (authDoctor.language as SupportedLanguage) || "en";

    const promptText = `Patient Name: ${elder?.name}\nAdherence Data: ${JSON.stringify(
      adherence,
      null,
      2
    )}\nLanguage: ${lang}\nSummarize in 3 to 5 clear sentences for the doctor.`;

    const geminiText = await callGemini({
      systemInstruction: getPatientSummarySystemPrompt(),
      contents: promptText,
    });

    const source = geminiText ? "ai" : "fallback";
    const content =
      geminiText ||
      generatePatientSummaryFallback(adherence, elder?.name || "Elder", lang);

    const saved = await prisma.aiPatientSummary.upsert({
      where: {
        elderId_doctorId_forDate: {
          elderId,
          doctorId: authDoctor.id,
          forDate,
        },
      },
      update: {
        content,
        stats: JSON.parse(JSON.stringify(adherence)),
      },
      create: {
        elderId,
        doctorId: authDoctor.id,
        forDate,
        content,
        stats: JSON.parse(JSON.stringify(adherence)),
      },
    });

    return successResponse({
      elderId,
      forDate: todayStr,
      content: saved.content,
      stats: saved.stats,
      source,
      disclaimer: AI_DISCLAIMER,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
