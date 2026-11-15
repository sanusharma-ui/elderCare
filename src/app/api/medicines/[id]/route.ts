import { handleApiError, successResponse } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { getElderAccess, requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { UpdateMedicineSchema } from "@/lib/validators";
import { MedicineStatus } from "@prisma/client";
import { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth();
    const { id } = await params;

    const medicine = await prisma.medicine.findUnique({
      where: { id },
      include: {
        schedules: {
          orderBy: { timeOfDay: "asc" },
        },
        prescribedBy: {
          select: {
            id: true,
            name: true,
            doctorProfile: true,
          },
        },
      },
    });

    if (!medicine) {
      throw AppError.notFound("Medicine not found");
    }

    const access = await getElderAccess(authUser.id, medicine.elderId);
    if (!access) {
      throw AppError.notFound("Medicine not found");
    }

    if (access === "FAMILY") {
      throw AppError.forbidden("Family members do not have access to medication details");
    }

    return successResponse(medicine);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth();
    const { id } = await params;

    const medicine = await prisma.medicine.findUnique({
      where: { id },
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
      throw AppError.forbidden("Only a linked doctor can modify medications");
    }

    const rawBody = await req.json();
    const data = UpdateMedicineSchema.parse(rawBody);

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.medicine.update({
        where: { id },
        data: {
          ...(data.name ? { name: data.name } : {}),
          ...(data.nameLocal !== undefined ? { nameLocal: data.nameLocal } : {}),
          ...(data.genericName !== undefined ? { genericName: data.genericName } : {}),
          ...(data.dosage ? { dosage: data.dosage } : {}),
          ...(data.form ? { form: data.form } : {}),
          ...(data.foodRelation ? { foodRelation: data.foodRelation } : {}),
          ...(data.instructions !== undefined ? { instructions: data.instructions } : {}),
          ...(data.warnings !== undefined ? { warnings: data.warnings } : {}),
          ...(data.status ? { status: data.status } : {}),
          ...(data.startDate ? { startDate: new Date(data.startDate) } : {}),
          ...(data.endDate !== undefined
            ? { endDate: data.endDate ? new Date(data.endDate) : null }
            : {}),
          ...(data.stockCount !== undefined ? { stockCount: data.stockCount } : {}),
          ...(data.refillThreshold !== undefined ? { refillThreshold: data.refillThreshold } : {}),
        },
        include: {
          schedules: true,
        },
      });

      await createAuditLog({
        actorId: authUser.id,
        elderId: medicine.elderId,
        action: "MEDICINE_UPDATED",
        entity: "Medicine",
        entityId: id,
        before: medicine,
        after: result,
        tx,
      });

      return result;
    });

    return successResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth();
    const { id } = await params;

    const medicine = await prisma.medicine.findUnique({
      where: { id },
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
      throw AppError.forbidden("Only a linked doctor can stop medications");
    }

    // Soft delete: status STOPPED (never hard delete clinical records)
    const stopped = await prisma.$transaction(async (tx) => {
      const result = await tx.medicine.update({
        where: { id },
        data: {
          status: MedicineStatus.STOPPED,
        },
      });

      await createAuditLog({
        actorId: authUser.id,
        elderId: medicine.elderId,
        action: "MEDICINE_STOPPED",
        entity: "Medicine",
        entityId: id,
        before: medicine,
        after: result,
        tx,
      });

      return result;
    });

    return successResponse({
      message: "Medicine stopped successfully",
      id: stopped.id,
      status: stopped.status,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
