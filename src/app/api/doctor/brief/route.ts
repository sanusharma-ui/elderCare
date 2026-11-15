import { generateOrFetchDailyBrief } from "@/lib/ai/daily-brief";
import { handleApiError, successResponse } from "@/lib/api-response";
import { SupportedLanguage } from "@/lib/i18n/messages";
import { requireAuth } from "@/lib/permissions";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    const authDoctor = await requireAuth([Role.DOCTOR]);
    const lang = (authDoctor.language as SupportedLanguage) || "en";

    const brief = await generateOrFetchDailyBrief(
      authDoctor.id,
      authDoctor.name,
      lang,
      false
    );

    return successResponse(brief);
  } catch (err) {
    return handleApiError(err);
  }
}
