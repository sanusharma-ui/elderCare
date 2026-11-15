import { handleApiError, successResponse } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { getElderAccess, requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { deriveTimeSlot } from "@/lib/time";
import { ReplaceSchedulesSchema } from "@/lib/validators";
import { NextRequest } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth();
    const { id } = await params;

    const medicine = await prisma.medicine.findUnique({
      where: { id },
      include: { schedules: true },
    });

    if (!medicine) {
      throw AppError.notFound("Medicine not found");
    }

    const access = await getElderAccess(authUser.id, medicine.elderId);
    if (!access) {
      throw AppError.notFound("Medicine not found");
    }

    // Write = linked DOCTOR only
    if (access !== "DOCTOR") {
      throw AppError.forbidden("Only a linked doctor can update medicine schedules");
    }

    const rawBody = await req.json();
    const data = ReplaceSchedulesSchema.parse(rawBody);

    const updated = await prisma.$transaction(async (tx) => {
      // Delete old schedules
      await tx.medicineSchedule.deleteMany({
        where: { medicineId: id },
      });

      // Create new schedules
      await tx.medicineSchedule.createMany({
        data: data.schedules.map((s) => ({
          medicineId: id,
          timeOfDay: s.timeOfDay,
          slot: deriveTimeSlot(s.timeOfDay),
          daysOfWeek: s.daysOfWeek,
          doseQuantity: s.doseQuantity,
          graceMinutes: s.graceMinutes,
          isActive: s.isActive,
        })),
      });

      const updatedMedicine = await tx.medicine.findUnique({
        where: { id },
        include: {
          schedules: {
            orderBy: { timeOfDay: "asc" },
          },
        },
      });

      await createAuditLog({
        actorId: authUser.id,
        elderId: medicine.elderId,
        action: "SCHEDULES_UPDATED",
        entity: "MedicineSchedule",
        entityId: id,
        before: medicine.schedules,
        after: updatedMedicine?.schedules,
        tx,
      });

      return updatedMedicine;
    });

    return successResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
