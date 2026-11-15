import { handleApiError, successResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PaginationQuerySchema } from "@/lib/validators";
import { AccessStatus, DoseStatus, Role } from "@prisma/client";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const authDoctor = await requireAuth([Role.DOCTOR]);
    const { searchParams } = new URL(req.url);

    const query = PaginationQuerySchema.parse({
      page: searchParams.get("page") ?? 1,
      limit: searchParams.get("limit") ?? 20,
    });

    // 1. Get active linked elder IDs
    const links = await prisma.elderAccess.findMany({
      where: {
        memberId: authDoctor.id,
        status: AccessStatus.ACTIVE,
      },
      select: { elderId: true },
    });

    const elderIds = links.map((l) => l.elderId);

    // 2. Query doctor's notifications and recent critical events for their patients
    const total = await prisma.notification.count({
      where: { userId: authDoctor.id },
    });

    const notifications = await prisma.notification.findMany({
      where: { userId: authDoctor.id },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: { createdAt: "desc" },
      include: {
        elder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return successResponse(notifications, {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
