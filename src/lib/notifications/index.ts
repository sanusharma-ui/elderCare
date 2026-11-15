import {
  formatMedicineNameForLanguage,
  renderMessage,
  SupportedLanguage,
} from "@/lib/i18n/messages";
import { prisma } from "@/lib/prisma";
import { NotificationType, Prisma } from "@prisma/client";

export interface CreateNotificationParams {
  userId: string;
  elderId?: string | null;
  type: NotificationType;
  templateKey: string;
  params: Record<string, string | number>;
  dedupeKey?: string | null;
  email?: boolean;
  tx?: Prisma.TransactionClient;
}

/**
 * Creates a localized in-app notification and queues an email if requested.
 * Safe against duplicate deliveries using the unique (userId, dedupeKey) constraint.
 */
export async function createNotification({
  userId,
  elderId,
  type,
  templateKey,
  params,
  dedupeKey,
  email = false,
  tx,
}: CreateNotificationParams) {
  const client = tx ?? prisma;

  // 1. Fetch recipient profile for preferred language and real email check
  const recipient = await client.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      language: true,
      hasRealEmail: true,
      email: true,
    },
  });

  if (!recipient) {
    return null;
  }

  const lang = (recipient.language as SupportedLanguage) || "en";

  // 2. Render localized title and body
  const { title, body } = renderMessage(templateKey, lang, params);

  // 3. Queue email ONLY if requested AND user has a real contact email
  const emailRequested = email && recipient.hasRealEmail && Boolean(recipient.email);

  try {
    const notification = await client.notification.create({
      data: {
        userId,
        elderId: elderId ?? null,
        type,
        title,
        body,
        data: {
          templateKey,
          params,
          lang,
        },
        dedupeKey: dedupeKey ?? null,
        emailRequested,
      },
    });

    return notification;
  } catch (err) {
    // Unique constraint violation P2002 on (userId, dedupeKey)
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      // Duplicate notification ignored safely
      return null;
    }
    throw err;
  }
}

export { formatMedicineNameForLanguage };
