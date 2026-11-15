import { handleApiError, successResponse } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { sanitizeUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { LoginSchema, normalizePhone } from "@/lib/validators";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const { identifier, password } = LoginSchema.parse(rawBody);

    const trimmed = identifier.trim();
    const normalizedEmail = trimmed.toLowerCase();
    const normalizedPhone = normalizePhone(trimmed);

    // Resolve identifier to user in public.User
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { phone: normalizedPhone },
          { authEmail: normalizedEmail },
        ],
      },
      include: {
        doctorProfile: true,
        elderProfile: true,
      },
    });

    if (!user) {
      throw AppError.invalidCredentials();
    }

    if (!user.isActive) {
      throw new AppError("USER_DEACTIVATED", "Account has been deactivated", 403);
    }

    // Authenticate with Supabase Auth using internal authEmail
    const serverSupabase = await createServerSupabaseClient();
    const { data: authData, error: authError } =
      await serverSupabase.auth.signInWithPassword({
        email: user.authEmail,
        password,
      });

    if (authError || !authData.session) {
      throw AppError.invalidCredentials();
    }

    return successResponse({
      user: sanitizeUser(user),
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at,
        token_type: "bearer",
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
