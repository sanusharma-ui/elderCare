import { handleApiError, successResponse } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { getElderAccess, requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { CreateAppointmentSchema } from "@/lib/validators";
import { AppointmentStatus, Prisma } from "@prisma/client";
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
      throw AppError.forbidden("Only a linked doctor can schedule appointments");
    }

    const rawBody = await req.json();
    const data = CreateAppointmentSchema.parse(rawBody);

    const appointment = await prisma.$transaction(async (tx) => {
      const created = await tx.appointment.create({
        data: {
          elderId,
          createdById: authUser.id,
          doctorId: data.doctorId ?? authUser.id,
          title: data.title,
          scheduledAt: new Date(data.scheduledAt),
          location: data.location ?? null,
          notes: data.notes ?? null,
          status: AppointmentStatus.SCHEDULED,
        },
      });

      await createAuditLog({
        actorId: authUser.id,
        elderId,
        action: "APPOINTMENT_CREATED",
        entity: "Appointment",
        entityId: created.id,
        after: created,
        tx,
      });

      return created;
    });

    return successResponse(appointment, undefined, 201);
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

    // Read = elder self, linked doctor, linked caretaker; FAMILY forbidden
    if (access === "FAMILY") {
      throw AppError.forbidden("Family members do not have access to clinical appointments");
    }

    const { searchParams } = new URL(req.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const statusParam = searchParams.get("status") as AppointmentStatus | null;

    const where: Prisma.AppointmentWhereInput = {
      elderId,
      ...(statusParam ? { status: statusParam } : {}),
      ...(fromParam || toParam
        ? {
            scheduledAt: {
              ...(fromParam ? { gte: new Date(fromParam) } : {}),
              ...(toParam ? { lte: new Date(toParam) } : {}),
            },
          }
        : {}),
    };

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            doctorProfile: true,
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    return successResponse(appointments);
  } catch (err) {
    return handleApiError(err);
  }
}
