import { prisma } from "@/lib/prisma";
import nodemailer, { type Transporter } from "nodemailer";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const secure = process.env.SMTP_SECURE !== "false";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    // Useful for quick serverless execution
    pool: false,
    maxConnections: 5,
  });

  return transporter;
}

export function buildSmritiEmailHtml(params: {
  title: string;
  body: string;
  alertType?: string;
  elderName?: string;
  actionText?: string;
}): string {
  const isUrgent =
    params.alertType === "MISSED_DOSE" ||
    params.alertType === "URGENT" ||
    params.title.toLowerCase().includes("urgent");

  const badgeColor = isUrgent ? "#dc2626" : "#0284c7";
  const badgeText = isUrgent ? "URGENT ALERT" : "MEDICATION UPDATE";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #0f172a; padding: 24px 32px; color: #ffffff; text-align: left; }
    .header h1 { margin: 0; font-size: 24px; color: #38bdf8; letter-spacing: -0.5px; }
    .header p { margin: 4px 0 0 0; font-size: 14px; color: #94a3b8; }
    .content { padding: 32px; font-size: 17px; line-height: 1.6; }
    .badge { display: inline-block; padding: 6px 12px; background: ${badgeColor}; color: #ffffff; border-radius: 6px; font-size: 13px; font-weight: 700; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
    .title { font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0; }
    .message-box { background: ${isUrgent ? "#fef2f2" : "#f0f9ff"}; border-left: 5px solid ${badgeColor}; padding: 18px 20px; border-radius: 6px; margin: 20px 0; font-size: 18px; color: #1e293b; font-weight: 500; }
    .action-box { background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 16px; margin-top: 24px; font-size: 15px; color: #475569; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; font-size: 13px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>स्मृति • Smriti</h1>
      <p>Elderly Care &amp; Medication Management Ecosystem</p>
    </div>
    <div class="content">
      <span class="badge">${badgeText}</span>
      <h2 class="title">${params.title}</h2>
      <div class="message-box">
        ${params.body.replace(/\n/g, "<br/>")}
      </div>
      ${
        isUrgent
          ? `<div class="action-box">
              <strong>Recommended Action:</strong> Please contact the elder or caretaker immediately to verify their well-being.
             </div>`
          : ""
      }
    </div>
    <div class="footer">
      This notification was sent by <strong>Smriti Care Ecosystem</strong>. To ensure safe delivery of reminders, please do not reply to this email.
    </div>
  </div>
</body>
</html>`;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; error?: string; simulated?: boolean }> {
  const mailer = getTransporter();

  // If SMTP is unconfigured in development/testing, simulate dispatch safely
  if (!mailer) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[SMTP-SIMULATED] To: ${params.to} | Subject: ${params.subject}`);
      return { success: true, simulated: true };
    }
    return {
      success: false,
      error: "SMTP credentials not configured (SMTP_USER/SMTP_PASS missing)",
    };
  }

  try {
    const from = process.env.SMTP_FROM || "Smriti Elder Care <alerts@smriti.app>";
    await mailer.sendMail({
      from,
      to: params.to,
      subject: params.subject,
      text: params.text || params.subject,
      html: params.html,
    });
    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[SMTP-ERROR] Failed to send email to ${params.to}:`, errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Stage 2 Email Outbox Processor
 * Scans pending notifications, dispatches via SMTP, and tracks attempts/errors.
 */
export async function processEmailOutbox(
  batchSize: number = 20,
  timeBudgetMs: number = 40000
): Promise<{
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
}> {
  const startTime = Date.now();
  let processed = 0;
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  const pendingNotifications = await prisma.notification.findMany({
    where: {
      emailRequested: true,
      emailSentAt: null,
      emailAttempts: { lt: 3 },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          hasRealEmail: true,
          language: true,
        },
      },
      elder: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: batchSize,
  });

  for (const notif of pendingNotifications) {
    // Check time budget
    if (Date.now() - startTime >= timeBudgetMs) {
      break;
    }

    processed++;

    // Strict rule: NEVER email phone-only or internal authEmail
    if (!notif.user.hasRealEmail || !notif.user.email) {
      await prisma.notification.update({
        where: { id: notif.id },
        data: {
          emailRequested: false,
          emailSentAt: new Date(),
        },
      });
      skipped++;
      continue;
    }

    const html = buildSmritiEmailHtml({
      title: notif.title,
      body: notif.body,
      alertType: notif.type,
      elderName: notif.elder?.name,
    });

    const result = await sendEmail({
      to: notif.user.email,
      subject: notif.title,
      html,
      text: notif.body,
    });

    if (result.success) {
      await prisma.notification.update({
        where: { id: notif.id },
        data: {
          emailSentAt: new Date(),
          emailError: null,
        },
      });
      sent++;
    } else {
      await prisma.notification.update({
        where: { id: notif.id },
        data: {
          emailAttempts: { increment: 1 },
          emailError: (result.error || "Unknown SMTP error").slice(0, 500),
        },
      });
      failed++;
    }
  }

  return { processed, sent, failed, skipped };
}
