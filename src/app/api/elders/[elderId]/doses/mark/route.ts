import { handleApiError, successResponse } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { createNotification } from "@/lib/notifications";
import { getElderAccess, requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { DEFAULT_TIMEZONE } from "@/lib/time";
import { AccessStatus, DoseStatus, NotificationType, Role } from "@prisma/client";
import { formatInTimeZone } from "date-fns-tz";
import { NextRequest } from "next/server";
import { z } from "zod";

const MarkDoseSchema = z.object({
  scheduleId: z.string().uuid("Invalid scheduleId format"),
  scheduledFor: z.string().datetime("scheduledFor must be an ISO UTC datetime"),
  status: z.enum(["TAKEN", "GIVEN", "SKIPPED"]),
  note: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ elderId: string }> }
) {
  try {
    const authUser = await requireAuth();
    const { elderId } = await params;

    const access = await getElderAccess(authUser.id, elderId);
    if (!access) {
      throw AppError.notFound("Elder not found");
    }

    const rawBody = await req.json();
    const data = MarkDoseSchema.parse(rawBody);

    // Permission enforcement:
    // ELDER (SELF): can mark TAKEN or SKIPPED
    // CARETAKER: can mark GIVEN or SKIPPED
    // DOCTOR & FAMILY: forbidden
    if (access === "SELF") {
      if (data.status === "GIVEN") {
        throw AppError.forbidden("Elder cannot mark dose as GIVEN (use TAKEN)");
      }
    } else if (access === "CARETAKER") {
      if (data.status === "TAKEN") {
        throw AppError.forbidden("Caretaker cannot mark dose as TAKEN (use GIVEN)");
      }
    } else {
      throw AppError.forbidden("Only the elder or an active caretaker can mark doses");
    }

    // Fetch elder profile for timezone
    const elder = await prisma.user.findUnique({
      where: { id: elderId },
      include: { elderProfile: true },
    });
    if (!elder) {
      throw AppError.notFound("Elder not found");
    }
    const timezone = elder.elderProfile?.timezone || DEFAULT_TIMEZONE;

    // Fetch schedule and verify it belongs to this elder
    const schedule = await prisma.medicineSchedule.findUnique({
      where: { id: data.scheduleId },
      include: {
        medicine: true,
      },
    });

    if (!schedule || schedule.medicine.elderId !== elderId) {
      throw AppError.notFound("Schedule not found for this elder");
    }

    const scheduledForDate = new Date(data.scheduledFor);
    const now = new Date();

    // Validate that scheduledFor matches schedule timeOfDay and dayOfWeek in elder timezone
    const localTimeOfDay = formatInTimeZone(scheduledForDate, timezone, "HH:mm");
    const localDayOfWeek = parseInt(formatInTimeZone(scheduledForDate, timezone, "i"), 10) % 7; // 0..6

    if (
      schedule.timeOfDay !== localTimeOfDay ||
      !schedule.daysOfWeek.includes(localDayOfWeek)
    ) {
      throw AppError.validation(
        `scheduledFor (${data.scheduledFor}) does not match schedule slot (${schedule.timeOfDay}) in ${timezone}`
      );
    }

    // Window check: Allowed from 60 minutes before scheduledFor until 12 hours after scheduledFor
    const windowStart = new Date(scheduledForDate.getTime() - 60 * 60 * 1000);
    const windowEnd = new Date(scheduledForDate.getTime() + 12 * 60 * 60 * 1000);

    if (now < windowStart) {
      throw new AppError(
        "BAD_REQUEST",
        "Dose cannot be marked earlier than 60 minutes before its scheduled time",
        422
      );
    }

    if (now > windowEnd) {
      throw new AppError(
        "BAD_REQUEST",
        "Dose completion window has closed (12 hours past scheduled time)",
        422
      );
    }

    // Atomic transaction for dose marking & stock update
    const result = await prisma.$transaction(async (tx) => {
      // Check existing dose log
      const existing = await tx.doseLog.findUnique({
        where: {
          scheduleId_scheduledFor: {
            scheduleId: data.scheduleId,
            scheduledFor: scheduledForDate,
          },
        },
      });

      // Idempotency: marking an already-marked dose with same status returns existing row
      if (existing && existing.status === data.status) {
        return { doseLog: existing, wasMissed: false, idempotent: true };
      }

      const wasMissed = existing?.status === DoseStatus.MISSED;

      const doseLog = await tx.doseLog.upsert({
        where: {
          scheduleId_scheduledFor: {
            scheduleId: data.scheduleId,
            scheduledFor: scheduledForDate,
          },
        },
        update: {
          status: data.status as DoseStatus,
          markedById: authUser.id,
          markedByRole: authUser.role,
          markedAt: now,
          note: data.note !== undefined ? data.note : existing?.note,
        },
        create: {
          scheduleId: data.scheduleId,
          medicineId: schedule.medicineId,
          elderId,
          scheduledFor: scheduledForDate,
          status: data.status as DoseStatus,
          markedById: authUser.id,
          markedByRole: authUser.role,
          markedAt: now,
          note: data.note || null,
        },
      });

      // Stock decrement on TAKEN or GIVEN
      if (
        (data.status === "TAKEN" || data.status === "GIVEN") &&
        schedule.medicine.stockCount !== null
      ) {
        const newStock = Math.max(0, schedule.medicine.stockCount - 1);
        await tx.medicine.update({
          where: { id: schedule.medicineId },
          data: { stockCount: newStock },
        });
      }

      await createAuditLog({
        actorId: authUser.id,
        elderId,
        action: wasMissed ? "DOSE_MARKED_LATE" : "DOSE_MARKED",
        entity: "DoseLog",
        entityId: doseLog.id,
        before: existing,
        after: doseLog,
        tx,
      });

      return { doseLog, wasMissed, idempotent: false };
    });

    // If dose was missed and completed late, inform active family members
    if (result.wasMissed) {
      const familyLinks = await prisma.elderAccess.findMany({
        where: {
          elderId,
          role: Role.FAMILY,
          status: AccessStatus.ACTIVE,
        },
        select: { memberId: true },
      });

      const formattedTime = formatInTimeZone(now, timezone, "hh:mm a");

      for (const link of familyLinks) {
        await createNotification({
          userId: link.memberId,
          elderId,
          type: NotificationType.MISSED_DOSE,
          templateKey: "dose_late_taken",
          params: {
            elderName: elder.name,
            medicines: schedule.medicine.name,
            time: formattedTime,
          },
          dedupeKey: `late:${result.doseLog.id}:${link.memberId}`,
          email: true,
        });
      }
    }

    return successResponse(result.doseLog);
  } catch (err) {
    return handleApiError(err);
  }
}
