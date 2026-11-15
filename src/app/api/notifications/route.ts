import { handleApiError, successResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PaginationQuerySchema } from "@/lib/validators";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth();
    const { searchParams } = new URL(req.url);

    const unreadOnly = searchParams.get("unread") === "true";
    const query = PaginationQuerySchema.parse({
      page: searchParams.get("page") ?? 1,
      limit: searchParams.get("limit") ?? 20,
    });

    const where = {
      userId: authUser.id,
      ...(unreadOnly ? { readAt: null } : {}),
    };

    const total = await prisma.notification.count({ where });

    const notifications = await prisma.notification.findMany({
      where,
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
