/**
 * Stage 2 Placeholder: Email Notification Service
 * In Stage 2, proactive emails will be dispatched using SMTP / Resend / SendGrid
 * for missed-dose alerts, upcoming appointments, and refill reminders.
 */
export async function sendEmailNotification(_payload: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  // Stage 2 implementation placeholder
}
