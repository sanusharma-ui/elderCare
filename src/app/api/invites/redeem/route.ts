import { handleApiError, successResponse } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, getClientIp, RATE_LIMIT_PRESETS } from "@/lib/rate-limit";
import { RedeemInviteSchema } from "@/lib/validators";
import { AccessStatus } from "@prisma/client";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    enforceRateLimit(
      `redeem:ip:${clientIp}`,
      RATE_LIMIT_PRESETS.INVITE_REDEEM.limit,
      RATE_LIMIT_PRESETS.INVITE_REDEEM.windowSeconds
    );

    const authUser = await requireAuth();
    enforceRateLimit(
      `redeem:user:${authUser.id}`,
      RATE_LIMIT_PRESETS.INVITE_REDEEM.limit,
      RATE_LIMIT_PRESETS.INVITE_REDEEM.windowSeconds
    );

    const rawBody = await req.json();
    const { code } = RedeemInviteSchema.parse(rawBody);

    const formattedCode = code.trim().toUpperCase();

    // 1. Check brute-force throttling: 5 failures in 15 minutes locks out redemption
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const failureCount = await prisma.redeemAttempt.count({
      where: {
        userId: authUser.id,
        success: false,
        createdAt: { gte: fifteenMinutesAgo },
      },
    });

    if (failureCount >= 5) {
      throw AppError.tooManyAttempts(
        "Too many failed redeem attempts. Invite redemption is locked for 15 minutes."
      );
    }

    // Helper to log failed attempt
    const recordFailure = async () => {
      await prisma.redeemAttempt.create({
        data: {
          userId: authUser.id,
          success: false,
        },
      });
    };

    // 2. Fetch invite
    const invite = await prisma.inviteCode.findUnique({
      where: { code: formattedCode },
      include: {
        elder: true,
      },
    });

    if (!invite) {
      await recordFailure();
      throw new AppError("INVITE_INVALID", "Invalid invite code", 400);
    }

    if (invite.revokedAt) {
      await recordFailure();
      throw new AppError("INVITE_INVALID", "This invite code has been revoked", 400);
    }

    if (invite.usedAt) {
      await recordFailure();
      throw new AppError("INVITE_ALREADY_USED", "This invite code has already been redeemed", 400);
    }

    if (new Date() > invite.expiresAt) {
      await recordFailure();
      throw new AppError("INVITE_EXPIRED", "This invite code has expired", 400);
    }

    // 3. Role check: caller's role must equal intendedRole
    if (authUser.role !== invite.intendedRole) {
      await recordFailure();
      throw AppError.forbidden(
        `This invite code requires the role ${invite.intendedRole}, but your current role is ${authUser.role}`
      );
    }

    // Cannot redeem own elder invite
    if (authUser.id === invite.elderId) {
      await recordFailure();
      throw AppError.badRequest("You cannot link to your own elder account via invite");
    }

    // 4. Atomic redemption transaction
    const result = await prisma.$transaction(async (tx) => {
      // Record success
      await tx.redeemAttempt.create({
        data: {
          userId: authUser.id,
          success: true,
        },
      });

      // Mark invite used
      const updatedInvite = await tx.inviteCode.update({
        where: { id: invite.id },
        data: {
          usedAt: new Date(),
          usedById: authUser.id,
        },
      });

      // Re-linking after revoke must reactivate the same row
      const existingAccess = await tx.elderAccess.findUnique({
        where: {
          elderId_memberId: {
            elderId: invite.elderId,
            memberId: authUser.id,
          },
        },
      });

      const access = await tx.elderAccess.upsert({
        where: {
          elderId_memberId: {
            elderId: invite.elderId,
            memberId: authUser.id,
          },
        },
        update: {
          status: AccessStatus.ACTIVE,
          role: invite.intendedRole,
          linkedViaInviteId: invite.id,
          revokedAt: null,
        },
        create: {
          elderId: invite.elderId,
          memberId: authUser.id,
          role: invite.intendedRole,
          status: AccessStatus.ACTIVE,
          linkedViaInviteId: invite.id,
        },
      });

      await createAuditLog({
        actorId: authUser.id,
        elderId: invite.elderId,
        action: "INVITE_REDEEMED",
        entity: "ElderAccess",
        entityId: access.id,
        before: existingAccess,
        after: access,
        tx,
      });

      return { access, invite: updatedInvite };
    });

    return successResponse({
      message: "Invite redeemed successfully. You are now linked to the elder.",
      elderId: invite.elderId,
      elderName: invite.elder.name,
      role: result.access.role,
      accessId: result.access.id,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
