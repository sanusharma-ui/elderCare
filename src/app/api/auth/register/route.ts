import { handleApiError, successResponse } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { sanitizeUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, getClientIp, RATE_LIMIT_PRESETS } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import {
  generateInternalAuthEmail,
  RegisterSchema,
} from "@/lib/validators";
import { Role } from "@prisma/client";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    enforceRateLimit(
      `register:ip:${clientIp}`,
      RATE_LIMIT_PRESETS.AUTH_REGISTER.limit,
      RATE_LIMIT_PRESETS.AUTH_REGISTER.windowSeconds,
      "Too many registration requests from this network. Please wait a few minutes before trying again."
    );

    const rawBody = await req.json();
    const data = RegisterSchema.parse(rawBody);

    const hasRealEmail = Boolean(data.email);
    const authEmail = hasRealEmail
      ? data.email!
      : generateInternalAuthEmail(data.phone!);

    // Check if user already exists in public.User
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          ...(data.email ? [{ email: data.email }] : []),
          ...(data.phone ? [{ phone: data.phone }] : []),
          { authEmail },
        ],
      },
    });

    if (existing) {
      throw AppError.conflict("An account with this email or phone already exists");
    }

    // 1. Create Supabase Auth user via Admin API (email_confirm: true bypasses rate limits & email sending)
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: authEmail,
        password: data.password,
        email_confirm: true,
        user_metadata: {
          name: data.name,
        },
      });

    if (authError || !authData.user) {
      throw AppError.badRequest(
        authError?.message || "Failed to create authentication credentials"
      );
    }

    const authUserId = authData.user.id;

    // 2. Create public User + role profile in a Prisma transaction
    let createdUser;
    try {
      createdUser = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            id: authUserId,
            name: data.name,
            email: data.email ?? null,
            authEmail,
            hasRealEmail,
            phone: data.phone ?? null,
            role: data.role,
            language: data.language,
            isActive: true,
            mustChangePassword: false,
          },
        });

        if (data.role === Role.DOCTOR) {
          await tx.doctorProfile.create({
            data: {
              userId: user.id,
              specialization: data.specialization!,
              registrationNumber: data.registrationNumber!,
              clinicName: data.clinicName!,
            },
          });
        } else if (data.role === Role.ELDER) {
          await tx.elderProfile.create({
            data: {
              userId: user.id,
              dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
              gender: data.gender ?? null,
              bloodGroup: data.bloodGroup ?? null,
              medicalConditions: data.medicalConditions ?? null,
              allergies: data.allergies ?? null,
              emergencyContactName: data.emergencyContactName ?? null,
              emergencyContactPhone: data.emergencyContactPhone ?? null,
              timezone: data.timezone ?? "Asia/Kolkata",
              largeTextMode: data.largeTextMode ?? true,
              voiceReminders: data.voiceReminders ?? false,
            },
          });
        }

        return user;
      });
    } catch (dbError) {
      // Compensating action: remove orphan auth user if DB insert fails
      await supabaseAdmin.auth.admin.deleteUser(authUserId).catch((delErr) => {
        console.error("Compensating rollback failed for user:", authUserId, delErr);
      });
      throw dbError;
    }

    // 3. Sign in to generate session tokens and set cookies
    const serverSupabase = await createServerSupabaseClient();
    const { data: signInData, error: signInError } =
      await serverSupabase.auth.signInWithPassword({
        email: authEmail,
        password: data.password,
      });

    if (signInError || !signInData.session) {
      // Even if session sign-in has a minor issue, the user is registered
      return successResponse(
        {
          user: sanitizeUser(createdUser),
          session: null,
          message: "Registration successful. Please log in.",
        },
        undefined,
        201
      );
    }

    return successResponse(
      {
        user: sanitizeUser(createdUser),
        session: {
          access_token: signInData.session.access_token,
          refresh_token: signInData.session.refresh_token,
          expires_at: signInData.session.expires_at,
          token_type: "bearer",
        },
      },
      undefined,
      201
    );
  } catch (err) {
    return handleApiError(err);
  }
}
