import { handleApiError, successResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const authUser = await requireAuth();

    const result = await prisma.notification.updateMany({
      where: {
        userId: authUser.id,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return successResponse({
      message: "All notifications marked as read",
      count: result.count,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
