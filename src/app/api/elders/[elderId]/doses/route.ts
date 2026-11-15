import { handleApiError, successResponse } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { getElderAccess, requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PaginationQuerySchema } from "@/lib/validators";
import { DoseStatus, Prisma } from "@prisma/client";
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

    if (access === "FAMILY") {
      throw AppError.forbidden("Family members do not have access to dose history logs");
    }

    const { searchParams } = new URL(req.url);
    const query = PaginationQuerySchema.parse({
      page: searchParams.get("page") ?? 1,
      limit: searchParams.get("limit") ?? 20,
    });

    const statusParam = searchParams.get("status") as DoseStatus | null;
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const where: Prisma.DoseLogWhereInput = {
      elderId,
      ...(statusParam ? { status: statusParam } : {}),
      ...(fromParam || toParam
        ? {
            scheduledFor: {
              ...(fromParam ? { gte: new Date(fromParam) } : {}),
              ...(toParam ? { lte: new Date(toParam) } : {}),
            },
          }
        : {}),
    };

    const total = await prisma.doseLog.count({ where });

    const doses = await prisma.doseLog.findMany({
      where,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: { scheduledFor: "desc" },
      include: {
        medicine: {
          select: {
            id: true,
            name: true,
            nameLocal: true,
            dosage: true,
            form: true,
            foodRelation: true,
          },
        },
        schedule: {
          select: {
            id: true,
            timeOfDay: true,
            slot: true,
            doseQuantity: true,
          },
        },
        markedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return successResponse(doses, {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
