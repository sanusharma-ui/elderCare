import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

function verifyCronSecret(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !authHeader || !authHeader.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7).trim();
  if (token.length !== secret.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(secret));
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");

  if (!verifyCronSecret(authHeader)) {
    return NextResponse.json({
      ok: true,
      service: "CareSaathi Cron Scheduler",
      status: "active",
      timestamp: new Date().toISOString(),
    });
  }

  return NextResponse.json({
    ok: true,
    message: "CareSaathi Cron Engine Active",
    endpoints: {
      tick: "/api/cron/tick (Runs every 1 minute: materialization, escalation, reminders, email outbox)",
      daily: "/api/cron/daily (Runs daily at 07:00 IST: AI doctor briefings)",
    },
    auth: "Authenticated via CRON_SECRET",
    timestamp: new Date().toISOString(),
  });
}
