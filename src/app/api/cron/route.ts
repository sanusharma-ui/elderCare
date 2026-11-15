import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "CareSaathi Cron Engine Active",
    endpoints: {
      tick: "/api/cron/tick (Runs every 1 minute: materialization, escalation, reminders, email outbox)",
      daily: "/api/cron/daily (Runs daily at 07:00 IST: AI doctor briefings)",
    },
    auth: "Requires 'Authorization: Bearer <CRON_SECRET>'",
  });
}
