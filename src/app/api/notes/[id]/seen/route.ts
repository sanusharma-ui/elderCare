import { handleApiError, successResponse } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { getElderAccess, requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { NextRequest } from "next/server";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth([Role.DOCTOR]);
    const { id } = await params;

    const note = await prisma.caretakerNote.findUnique({
      where: { id },
    });

    if (!note) {
      throw AppError.notFound("Note not found");
    }

    const access = await getElderAccess(authUser.id, note.elderId);
    if (!access) {
      throw AppError.notFound("Note not found");
    }

    if (access !== "DOCTOR") {
      throw AppError.forbidden("Only a linked doctor can acknowledge caretaker notes");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.caretakerNote.update({
        where: { id },
        data: { doctorSeenAt: new Date() },
      });

      await createAuditLog({
        actorId: authUser.id,
        elderId: note.elderId,
        action: "CARETAKER_NOTE_SEEN",
        entity: "CaretakerNote",
        entityId: id,
        before: note,
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
