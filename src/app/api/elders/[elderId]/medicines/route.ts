import { handleApiError, successResponse } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { getElderAccess, requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { deriveTimeSlot } from "@/lib/time";
import { CreateMedicineSchema } from "@/lib/validators";
import { MedicineStatus } from "@prisma/client";
import { NextRequest } from "next/server";

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

    // Write = linked DOCTOR only
    if (access !== "DOCTOR") {
      throw AppError.forbidden("Only a linked doctor can prescribe medications");
    }

    const rawBody = await req.json();
    const data = CreateMedicineSchema.parse(rawBody);

    const created = await prisma.$transaction(async (tx) => {
      const medicine = await tx.medicine.create({
        data: {
          elderId,
          prescribedById: authUser.id,
          name: data.name,
          nameLocal: data.nameLocal ?? null,
          genericName: data.genericName ?? null,
          dosage: data.dosage,
          form: data.form,
          foodRelation: data.foodRelation,
          instructions: data.instructions ?? null,
          warnings: data.warnings ?? null,
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : null,
          stockCount: data.stockCount ?? null,
          refillThreshold: data.refillThreshold ?? null,
          status: MedicineStatus.ACTIVE,
          schedules: {
            create: data.schedules.map((s) => ({
              timeOfDay: s.timeOfDay,
              slot: deriveTimeSlot(s.timeOfDay),
              daysOfWeek: s.daysOfWeek,
              doseQuantity: s.doseQuantity,
              graceMinutes: s.graceMinutes,
              isActive: s.isActive,
            })),
          },
        },
        include: {
          schedules: true,
        },
      });

      await createAuditLog({
        actorId: authUser.id,
        elderId,
        action: "MEDICINE_CREATED",
        entity: "Medicine",
        entityId: medicine.id,
        after: medicine,
        tx,
      });

      return medicine;
    });

    return successResponse(created, undefined, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function GET(
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

    // Read = ELDER self, linked DOCTOR, linked CARETAKER; FAMILY forbidden
    if (access === "FAMILY") {
      throw AppError.forbidden("Family members do not have access to medication details");
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status") as MedicineStatus | null;

    const medicines = await prisma.medicine.findMany({
      where: {
        elderId,
        ...(statusParam ? { status: statusParam } : {}),
      },
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
      orderBy: { createdAt: "desc" },
    });

    return successResponse(medicines);
  } catch (err) {
    return handleApiError(err);
  }
}
