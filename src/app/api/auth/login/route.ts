import { handleApiError, successResponse } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { sanitizeUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, getClientIp, RATE_LIMIT_PRESETS } from "@/lib/rate-limit";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { LoginSchema, normalizePhone } from "@/lib/validators";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);

    // 1. Enforce IP-level rate limit (5 attempts / 60s)
    enforceRateLimit(
      `login:ip:${clientIp}`,
      RATE_LIMIT_PRESETS.AUTH_LOGIN.limit,
      RATE_LIMIT_PRESETS.AUTH_LOGIN.windowSeconds,
      "Too many login attempts from this network. Please wait a minute before trying again."
    );

    const rawBody = await req.json();
    const { identifier, password } = LoginSchema.parse(rawBody);

    const trimmed = identifier.trim();
    const normalizedEmail = trimmed.toLowerCase();
    const normalizedPhone = normalizePhone(trimmed);
    const targetKey = normalizedPhone || normalizedEmail;

    // 2. Enforce account-level targeted brute force limit (5 attempts / 60s per target)
    enforceRateLimit(
      `login:target:${targetKey}`,
      RATE_LIMIT_PRESETS.AUTH_LOGIN.limit,
      RATE_LIMIT_PRESETS.AUTH_LOGIN.windowSeconds,
      "Too many failed login attempts for this account. Please wait a minute before trying again."
    );

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
