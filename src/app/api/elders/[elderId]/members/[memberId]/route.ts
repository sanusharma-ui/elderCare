import { handleApiError, successResponse } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { getElderAccess, requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { AccessStatus } from "@prisma/client";
import { NextRequest } from "next/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ elderId: string; memberId: string }> }
) {
  try {
    const authUser = await requireAuth();
    const { elderId, memberId } = await params;

    const access = await getElderAccess(authUser.id, elderId);
    if (!access) {
      throw AppError.notFound("Elder not found");
    }

    // Only the elder can revoke a member's access
    if (access !== "SELF") {
      throw AppError.forbidden("Only the elder can revoke member access");
    }

    const memberAccess = await prisma.elderAccess.findUnique({
      where: {
        elderId_memberId: {
          elderId,
          memberId,
        },
      },
    });

    if (!memberAccess || memberAccess.status !== AccessStatus.ACTIVE) {
      throw AppError.notFound("Active member access link not found");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const revoked = await tx.elderAccess.update({
        where: { id: memberAccess.id },
        data: {
          status: AccessStatus.REVOKED,
          revokedAt: new Date(),
        },
      });

      await createAuditLog({
        actorId: authUser.id,
        elderId,
        action: "MEMBER_REVOKED",
        entity: "ElderAccess",
        entityId: memberAccess.id,
        before: memberAccess,
        after: revoked,
        tx,
      });

      return revoked;
    });

    return successResponse({
      message: "Member access revoked successfully",
      accessId: updated.id,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
