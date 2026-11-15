import { handleApiError, successResponse } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { requireAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ChangePasswordSchema } from "@/lib/validators";
import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth();
    enforceRateLimit(
      `change-password:user:${authUser.id}`,
      5,
      300,
      "Too many password change attempts. Please wait 5 minutes before trying again."
    );

    const rawBody = await req.json();
    const { currentPassword, newPassword } = ChangePasswordSchema.parse(rawBody);

    // Verify current password by attempting sign-in with user's internal authEmail
    const tempSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    const { error: verifyError } = await tempSupabase.auth.signInWithPassword({
      email: authUser.authEmail,
      password: currentPassword,
    });

    if (verifyError) {
      throw AppError.invalidCredentials("Current password is incorrect");
    }

    // Update password via Supabase Admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      authUser.id,
      {
        password: newPassword,
      }
    );

    if (updateError) {
      throw AppError.badRequest(updateError.message || "Failed to update password");
    }

    // Reset mustChangePassword flag in database
    await prisma.user.update({
      where: { id: authUser.id },
      data: { mustChangePassword: false },
    });

    return successResponse({
      message: "Password changed successfully",
    });
  } catch (err) {
    return handleApiError(err);
  }
}
