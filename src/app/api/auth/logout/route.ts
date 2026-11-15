import { handleApiError, successResponse } from "@/lib/api-response";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();

    return successResponse({
      message: "Successfully logged out",
    });
  } catch (err) {
    return handleApiError(err);
  }
}
