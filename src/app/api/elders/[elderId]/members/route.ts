import { handleApiError, successResponse } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { getElderAccess, requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { AccessStatus } from "@prisma/client";
import { NextRequest } from "next/server";

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

    // Elder is the center of control: only the elder self can list their members
    if (access !== "SELF") {
      throw AppError.forbidden("Only the elder can view linked care team members");
    }

    const members = await prisma.elderAccess.findMany({
      where: {
        elderId,
        status: AccessStatus.ACTIVE,
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            language: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = members.map((m) => ({
      accessId: m.id,
      memberId: m.member.id,
      name: m.member.name,
      email: m.member.email,
      phone: m.member.phone,
      role: m.role,
      linkedAt: m.createdAt,
    }));

    return successResponse(formatted);
  } catch (err) {
    return handleApiError(err);
  }
}
