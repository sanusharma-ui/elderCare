import { generateOrFetchDailyBrief } from "@/lib/ai/daily-brief";
import { SupportedLanguage } from "@/lib/i18n/messages";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function verifyCronSecret(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !authHeader || !authHeader.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7).trim();
  if (token.length !== secret.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(secret));
}

async function handleCronDaily(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!verifyCronSecret(authHeader)) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Invalid cron secret" } },
      { status: 401 }
    );
  }

  const force = req.nextUrl.searchParams.get("force") === "1";

  const doctors = await prisma.user.findMany({
    where: {
      role: Role.DOCTOR,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      language: true,
    },
  });

  let briefsGenerated = 0;
  let briefsSkipped = 0;

  for (const doctor of doctors) {
    try {
      const lang = (doctor.language as SupportedLanguage) || "en";
      const brief = await generateOrFetchDailyBrief(doctor.id, doctor.name, lang, force);
      if (brief.source === "cached") {
        briefsSkipped++;
      } else {
        briefsGenerated++;
      }
    } catch (err) {
      console.error(`[CRON_DAILY] Failed to generate brief for doctor ${doctor.id}:`, err);
    }
  }

  return NextResponse.json({
    ok: true,
    data: {
      doctorsProcessed: doctors.length,
      briefsGenerated,
      briefsSkipped,
    },
  });
}

export async function GET(req: NextRequest) {
  return handleCronDaily(req);
}

export async function POST(req: NextRequest) {
  return handleCronDaily(req);
}
