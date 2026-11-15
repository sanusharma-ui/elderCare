import { handleApiError, successResponse } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { DoseStatus } from "@prisma/client";
import { NextRequest } from "next/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ doseLogId: string }> }
) {
  try {
    const authUser = await requireAuth();
    const { doseLogId } = await params;

    const doseLog = await prisma.doseLog.findUnique({
      where: { id: doseLogId },
      include: {
        medicine: true,
        schedule: true,
      },
    });

    if (!doseLog) {
      throw AppError.notFound("Dose log not found");
    }

    // Must be the same actor who marked it
    if (doseLog.markedById !== authUser.id) {
      throw AppError.forbidden("Only the person who marked this dose can undo it");
    }

    if (!doseLog.markedAt) {
      throw AppError.badRequest("Dose has not been marked as completed");
    }

    const now = new Date();
    const tenMinutes = 10 * 60 * 1000;

    if (now.getTime() - doseLog.markedAt.getTime() > tenMinutes) {
      throw new AppError(
        "BAD_REQUEST",
        "Undo window has expired. Doses can only be undone within 10 minutes of marking.",
        422
      );
    }

    const graceMs = doseLog.schedule.graceMinutes * 60 * 1000;
    const hasGraceExpired = now.getTime() > doseLog.scheduledFor.getTime() + graceMs;
    const resetStatus = hasGraceExpired ? DoseStatus.MISSED : DoseStatus.PENDING;

    const result = await prisma.$transaction(async (tx) => {
      // Restore stock if previously TAKEN or GIVEN
      if (
        (doseLog.status === DoseStatus.TAKEN || doseLog.status === DoseStatus.GIVEN) &&
        doseLog.medicine.stockCount !== null
      ) {
        await tx.medicine.update({
          where: { id: doseLog.medicineId },
          data: { stockCount: { increment: 1 } },
        });
      }

      const updated = await tx.doseLog.update({
        where: { id: doseLogId },
        data: {
          status: resetStatus,
          markedById: null,
          markedByRole: null,
          markedAt: null,
        },
      });

      await createAuditLog({
        actorId: authUser.id,
        elderId: doseLog.elderId,
        action: "DOSE_MARK_UNDONE",
        entity: "DoseLog",
        entityId: doseLog.id,
        before: doseLog,
        after: updated,
        tx,
      });

      return updated;
    });

    return successResponse(result);
  } catch (err) {
    return handleApiError(err);
  }
}
