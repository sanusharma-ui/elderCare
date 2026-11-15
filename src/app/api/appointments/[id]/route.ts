import { handleApiError, successResponse } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { getElderAccess, requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { UpdateAppointmentSchema } from "@/lib/validators";
import { AppointmentStatus } from "@prisma/client";
import { NextRequest } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth();
    const { id } = await params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw AppError.notFound("Appointment not found");
    }

    const access = await getElderAccess(authUser.id, appointment.elderId);
    if (!access) {
      throw AppError.notFound("Appointment not found");
    }

    // Write = linked DOCTOR only
    if (access !== "DOCTOR") {
      throw AppError.forbidden("Only a linked doctor can modify appointments");
    }

    const rawBody = await req.json();
    const data = UpdateAppointmentSchema.parse(rawBody);

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.appointment.update({
        where: { id },
        data: {
          ...(data.title ? { title: data.title } : {}),
          ...(data.scheduledAt ? { scheduledAt: new Date(data.scheduledAt) } : {}),
          ...(data.location !== undefined ? { location: data.location } : {}),
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
          ...(data.status ? { status: data.status } : {}),
          ...(data.doctorId !== undefined ? { doctorId: data.doctorId } : {}),
        },
      });

      await createAuditLog({
        actorId: authUser.id,
        elderId: appointment.elderId,
        action: "APPOINTMENT_UPDATED",
        entity: "Appointment",
        entityId: id,
        before: appointment,
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

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw AppError.notFound("Appointment not found");
    }

    const access = await getElderAccess(authUser.id, appointment.elderId);
    if (!access) {
      throw AppError.notFound("Appointment not found");
    }

    // Write = linked DOCTOR only
    if (access !== "DOCTOR") {
      throw AppError.forbidden("Only a linked doctor can cancel appointments");
    }

    const cancelled = await prisma.$transaction(async (tx) => {
      const result = await tx.appointment.update({
        where: { id },
        data: {
          status: AppointmentStatus.CANCELLED,
        },
      });

      await createAuditLog({
        actorId: authUser.id,
        elderId: appointment.elderId,
        action: "APPOINTMENT_CANCELLED",
        entity: "Appointment",
        entityId: id,
        before: appointment,
        after: result,
        tx,
      });

      return result;
    });

    return successResponse({
      message: "Appointment cancelled successfully",
      id: cancelled.id,
      status: cancelled.status,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
