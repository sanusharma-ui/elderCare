import { calculateElderAdherence } from "@/lib/analytics";
import { handleApiError, successResponse } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { getElderAccess, requireAuth } from "@/lib/permissions";
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

    // FAMILY role: strictly forbidden from clinical adherence analytics
    if (access === "FAMILY") {
      throw AppError.forbidden("Family members do not have access to clinical adherence analytics");
    }

    const { searchParams } = new URL(req.url);
    const daysParam = parseInt(searchParams.get("days") || "7", 10);
    const days = isNaN(daysParam) || daysParam <= 0 ? 7 : Math.min(daysParam, 90);

    const analytics = await calculateElderAdherence(elderId, days);

    return successResponse(analytics);
  } catch (err) {
    return handleApiError(err);
  }
}
