import { NextResponse } from "next/server";

/**
 * Stage 2 Placeholder: Cron Webhook Endpoint
 * In Stage 2, scheduled jobs (Vercel Cron / external runners) ping this endpoint
 * with Authorization: Bearer CRON_SECRET to trigger email reminders and AI summaries.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Smriti cron runner placeholder for Stage 2",
  });
}
