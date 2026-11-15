import { handleApiError, successResponse } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { AccessStatus } from "@prisma/client";
import { NextRequest } from "next/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ elderId: string }> }
) {
  try {
    const authUser = await requireAuth();
    const { elderId } = await params;

    const access = await prisma.elderAccess.findUnique({
      where: {
        elderId_memberId: {
          elderId,
          memberId: authUser.id,
        },
      },
    });

    if (!access || access.status !== AccessStatus.ACTIVE) {
      throw AppError.notFound("Active link to this elder not found");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const revoked = await tx.elderAccess.update({
        where: { id: access.id },
        data: {
          status: AccessStatus.REVOKED,
          revokedAt: new Date(),
        },
      });

      await createAuditLog({
        actorId: authUser.id,
        elderId,
        action: "MEMBER_UNLINKED",
        entity: "ElderAccess",
        entityId: access.id,
        before: access,
        after: revoked,
        tx,
      });

      return revoked;
    });

    return successResponse({
      message: "Successfully unlinked from elder",
      accessId: updated.id,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
