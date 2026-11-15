import { calculateDoctorDashboardMetrics } from "@/lib/analytics";
import { callGemini, checkAiRateLimit } from "@/lib/ai/gemini";
import {
  AI_DISCLAIMER,
  generateDailyBriefFallback,
  getDailyBriefSystemPrompt,
  getDailyBriefUserPrompt,
} from "@/lib/ai/prompts";
import { SupportedLanguage } from "@/lib/i18n/messages";
import { prisma } from "@/lib/prisma";
import { DEFAULT_TIMEZONE, getTodayDateString } from "@/lib/time";
import { fromZonedTime } from "date-fns-tz";

export async function generateOrFetchDailyBrief(
  doctorId: string,
  doctorName: string,
  doctorLang: SupportedLanguage,
  forceRefresh: boolean = false
) {
  const todayStr = getTodayDateString(DEFAULT_TIMEZONE);
  const briefDate = fromZonedTime(`${todayStr}T00:00:00`, DEFAULT_TIMEZONE);

  if (!forceRefresh) {
    const cached = await prisma.aiBrief.findUnique({
      where: {
        doctorId_briefDate: {
          doctorId,
          briefDate,
        },
      },
    });

    if (cached) {
      return {
        briefDate: todayStr,
        content: cached.content,
        stats: cached.stats,
        source: "cached",
        disclaimer: AI_DISCLAIMER,
      };
    }
  }

  // Rate limit check
  checkAiRateLimit(doctorId);

  // Compute strictly from Section E analytics
  const metrics = await calculateDoctorDashboardMetrics(doctorId);

  const geminiResponse = await callGemini({
    systemInstruction: getDailyBriefSystemPrompt(),
    contents: getDailyBriefUserPrompt(metrics, doctorName, doctorLang),
  });

  const source = geminiResponse ? "ai" : "fallback";
  const content =
    geminiResponse ||
    generateDailyBriefFallback(metrics, doctorName, doctorLang);

  const saved = await prisma.aiBrief.upsert({
    where: {
      doctorId_briefDate: {
        doctorId,
        briefDate,
      },
    },
    update: {
      content,
      stats: JSON.parse(JSON.stringify(metrics)),
    },
    create: {
      doctorId,
      briefDate,
      content,
      stats: JSON.parse(JSON.stringify(metrics)),
    },
  });

  return {
    briefDate: todayStr,
    content: saved.content,
    stats: saved.stats,
    source,
    disclaimer: AI_DISCLAIMER,
  };
}
