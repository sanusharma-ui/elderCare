import { handleApiError, successResponse } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { getElderAccess, requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { CreateInviteSchema } from "@/lib/validators";
import { Role } from "@prisma/client";
import crypto from "crypto";
import { NextRequest } from "next/server";

const INVITE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function generateInviteCode(): string {
  let part1 = "";
  let part2 = "";
  for (let i = 0; i < 4; i++) {
    part1 += INVITE_ALPHABET[crypto.randomInt(0, INVITE_ALPHABET.length)];
    part2 += INVITE_ALPHABET[crypto.randomInt(0, INVITE_ALPHABET.length)];
  }
  return `${part1}-${part2}`;
}

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

    const rawBody = await req.json();
    const { intendedRole } = CreateInviteSchema.parse(rawBody);

    // Permission rules:
    // - Elder self: can generate for DOCTOR, CARETAKER, or FAMILY
    // - Active Caretaker: can generate FAMILY invite codes ONLY
    // - Others: forbidden
    if (access === "SELF") {
      // Allowed any intendedRole
    } else if (access === "CARETAKER") {
      if (intendedRole !== Role.FAMILY) {
        throw AppError.forbidden("Caretakers can only generate invite codes for FAMILY members");
      }
    } else {
      throw AppError.forbidden("You do not have permission to generate invite codes for this elder");
    }

    // Generate unique code with collision retry
    let code = generateInviteCode();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.inviteCode.findUnique({ where: { code } });
      if (!existing) break;
      code = generateInviteCode();
      attempts++;
    }

    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours validity

    const invite = await prisma.$transaction(async (tx) => {
      const created = await tx.inviteCode.create({
        data: {
          code,
          elderId,
          createdById: authUser.id,
          intendedRole,
          expiresAt,
        },
      });

      await createAuditLog({
        actorId: authUser.id,
        elderId,
        action: "INVITE_CREATED",
        entity: "InviteCode",
        entityId: created.id,
        after: created,
        tx,
      });

      return created;
    });

    return successResponse(
      {
        id: invite.id,
        code: invite.code,
        intendedRole: invite.intendedRole,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
      },
      undefined,
      201
    );
  } catch (err) {
    return handleApiError(err);
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ elderId: string }> }
) {
  try {
    const authUser = await requireAuth();
    const { elderId } = await params;

    const access = await getElderAccess(authUser.id, elderId);
    if (!access) {
      throw AppError.notFound("Elder not found");
    }

    // Only the elder self can list all active invite codes
    if (access !== "SELF") {
      throw AppError.forbidden("Only the elder can view active invite codes");
    }

    const now = new Date();
    const invites = await prisma.inviteCode.findMany({
      where: {
        elderId,
        usedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(invites);
  } catch (err) {
    return handleApiError(err);
  }
}
