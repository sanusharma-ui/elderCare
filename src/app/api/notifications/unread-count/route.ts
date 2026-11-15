import { handleApiError, successResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const authUser = await requireAuth();

    const count = await prisma.notification.count({
      where: {
        userId: authUser.id,
        readAt: null,
      },
    });

    return successResponse({ unreadCount: count });
  } catch (err) {
    return handleApiError(err);
  }
}
