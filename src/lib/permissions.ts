import { AccessStatus, Role, User } from "@prisma/client";
import { headers } from "next/headers";
import { AppError } from "./errors";
import { prisma } from "./prisma";
import { supabaseAdmin } from "./supabase/admin";
import { createClient as createServerSupabaseClient } from "./supabase/server";
import { verifySupabaseToken } from "./supabase/token";

export type ElderAccessType = "SELF" | "DOCTOR" | "CARETAKER" | "FAMILY" | null;

export interface AuthenticatedUser extends User {}

/**
 * Strips internal and security-sensitive fields from user objects.
 */
export function sanitizeUser(user: Partial<User>) {
  const { authEmail: _authEmail, ...safeUser } = user;
  return safeUser;
}

/**
 * Authenticates the current request via EITHER:
 * 1. Bearer token in the "Authorization" header (ideal for Postman / API clients)
 * 2. Supabase session cookies (ideal for web browser clients)
 *
 * Verifies identity cryptographically with Supabase Auth,
 * loads the public User record, verifies isActive, and enforces role access.
 * Role is read EXCLUSIVELY from our public User table.
 */
export async function requireAuth(allowedRoles?: Role[]): Promise<AuthenticatedUser> {
  const headersList = await headers();
  const authHeader = headersList.get("authorization") || headersList.get("Authorization");

  let supabaseUserId: string | null = null;

  // 1. Check Bearer token first (Postman / Thunder Client)
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();
    const verifiedUser = await verifySupabaseToken(token);
    if (!verifiedUser) {
      throw AppError.unauthorized("Invalid or expired authentication token");
    }
    supabaseUserId = verifiedUser.id;
  } else {
    // 2. Check Supabase session cookies (SSR / Browser)
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        throw AppError.unauthorized("Authentication required");
      }
      supabaseUserId = user.id;
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw AppError.unauthorized("Authentication required");
    }
  }

  if (!supabaseUserId) {
    throw AppError.unauthorized("Authentication required");
  }

  // 3. Load user record from public.User table
  const user = await prisma.user.findUnique({
    where: { id: supabaseUserId },
  });

  if (!user) {
    throw AppError.unauthorized("User profile not found");
  }

  if (!user.isActive) {
    throw new AppError("USER_DEACTIVATED", "Account has been deactivated", 403);
  }

  // 4. Role validation (ONLY from public.User.role)
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    throw AppError.forbidden(
      `Access denied: requires one of [${allowedRoles.join(", ")}] role`
    );
  }

  return user;
}

/**
 * Central IDOR-protection helper.
 * Determines the active access relation between a user and an elder:
 * - "SELF": User is the elder themself
 * - "DOCTOR": User is an active linked doctor
 * - "CARETAKER": User is an active linked caretaker
 * - "FAMILY": User is an active linked family member
 * - null: No active link exists
 */
export async function getElderAccess(
  userId: string,
  elderId: string
): Promise<ElderAccessType> {
  if (userId === elderId) {
    return "SELF";
  }

  const access = await prisma.elderAccess.findUnique({
    where: {
      elderId_memberId: {
        elderId,
        memberId: userId,
      },
    },
  });

  if (!access || access.status !== AccessStatus.ACTIVE) {
    return null;
  }

  if (access.role === Role.DOCTOR) return "DOCTOR";
  if (access.role === Role.CARETAKER) return "CARETAKER";
  if (access.role === Role.FAMILY) return "FAMILY";

  return null;
}
