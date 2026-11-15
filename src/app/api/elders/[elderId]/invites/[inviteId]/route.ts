import { handleApiError, successResponse } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { getElderAccess, requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ elderId: string; inviteId: string }> }
) {
  try {
    const authUser = await requireAuth();
    const { elderId, inviteId } = await params;

    const access = await getElderAccess(authUser.id, elderId);
    if (!access) {
      throw AppError.notFound("Elder not found");
    }

    if (access !== "SELF") {
      throw AppError.forbidden("Only the elder can revoke invite codes");
    }

    const invite = await prisma.inviteCode.findFirst({
      where: {
        id: inviteId,
        elderId,
      },
    });

    if (!invite) {
      throw AppError.notFound("Invite code not found");
    }

    if (invite.revokedAt) {
      throw AppError.badRequest("Invite is already revoked");
    }

    if (invite.usedAt) {
      throw AppError.badRequest("Invite has already been redeemed and cannot be revoked");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const revoked = await tx.inviteCode.update({
        where: { id: invite.id },
        data: { revokedAt: new Date() },
      });

      await createAuditLog({
        actorId: authUser.id,
        elderId,
        action: "INVITE_REVOKED",
        entity: "InviteCode",
        entityId: invite.id,
        before: invite,
        after: revoked,
        tx,
      });

      return revoked;
    });

    return successResponse({
      message: "Invite code revoked successfully",
      inviteId: updated.id,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
