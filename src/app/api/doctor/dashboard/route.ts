import { calculateDoctorDashboardMetrics } from "@/lib/analytics";
import { handleApiError, successResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/permissions";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    const authDoctor = await requireAuth([Role.DOCTOR]);

    const dashboard = await calculateDoctorDashboardMetrics(authDoctor.id);

    return successResponse(dashboard);
  } catch (err) {
    return handleApiError(err);
  }
}
