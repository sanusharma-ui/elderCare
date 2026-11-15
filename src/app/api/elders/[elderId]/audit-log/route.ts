import { handleApiError, successResponse } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { getElderAccess, requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PaginationQuerySchema } from "@/lib/validators";
import { NextRequest } from "next/server";

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

    // Elder self and linked doctor only
    if (access !== "SELF" && access !== "DOCTOR") {
      throw AppError.forbidden("Only the elder or linked doctor can review the audit log");
    }

    const { searchParams } = new URL(req.url);
    const query = PaginationQuerySchema.parse({
      page: searchParams.get("page") ?? 1,
      limit: searchParams.get("limit") ?? 20,
    });

    const total = await prisma.auditLog.count({
      where: { elderId },
    });

    const logs = await prisma.auditLog.findMany({
      where: { elderId },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: { createdAt: "desc" },
    });

    return successResponse(logs, {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
