import { handleApiError, successResponse } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { createNotification } from "@/lib/notifications";
import { getElderAccess, requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PaginationQuerySchema } from "@/lib/validators";
import { AccessStatus, NoteSeverity, NotificationType, Role } from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";

const CreateNoteSchema = z.object({
  text: z.string().min(1, "Note text is required").max(1000, "Note text cannot exceed 1000 characters"),
  severity: z.nativeEnum(NoteSeverity).default(NoteSeverity.INFO),
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

    // CARETAKER only can create notes
    if (access !== "CARETAKER") {
      throw AppError.forbidden("Only an active caretaker can create caretaker notes");
    }

    const rawBody = await req.json();
    const data = CreateNoteSchema.parse(rawBody);

    const elder = await prisma.user.findUnique({
      where: { id: elderId },
      select: { id: true, name: true },
    });

    const note = await prisma.$transaction(async (tx) => {
      const created = await tx.caretakerNote.create({
        data: {
          elderId,
          authorId: authUser.id,
          text: data.text,
          severity: data.severity,
        },
        include: {
          author: {
            select: { id: true, name: true, role: true },
          },
        },
      });

      await createAuditLog({
        actorId: authUser.id,
        elderId,
        action: "CARETAKER_NOTE_CREATED",
        entity: "CaretakerNote",
        entityId: created.id,
        after: created,
        tx,
      });

      return created;
    });

    // Notify linked doctors
    const doctorLinks = await prisma.elderAccess.findMany({
      where: {
        elderId,
        role: Role.DOCTOR,
        status: AccessStatus.ACTIVE,
      },
      select: { memberId: true },
    });

    const isUrgent = data.severity === NoteSeverity.URGENT;
    const templateKey = isUrgent ? "caretaker_note_urgent" : "caretaker_note";

    for (const link of doctorLinks) {
      await createNotification({
        userId: link.memberId,
        elderId,
        type: NotificationType.CARETAKER_NOTE,
        templateKey,
        params: {
          elderName: elder?.name || "Elder",
          authorName: authUser.name,
          text: data.text,
        },
        dedupeKey: `note:${note.id}:${link.memberId}`,
        email: isUrgent, // Immediate email dispatch for URGENT notes
      });
    }

    return successResponse(note, undefined, 201);
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

    // Read: DOCTOR, CARETAKER, SELF. Family: forbidden.
    if (access === "FAMILY") {
      throw AppError.forbidden("Family members do not have access to caretaker clinical notes");
    }

    const { searchParams } = new URL(req.url);
    const query = PaginationQuerySchema.parse({
      page: searchParams.get("page") ?? 1,
      limit: searchParams.get("limit") ?? 20,
    });

    const total = await prisma.caretakerNote.count({
      where: { elderId },
    });

    const notes = await prisma.caretakerNote.findMany({
      where: { elderId },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return successResponse(notes, {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
