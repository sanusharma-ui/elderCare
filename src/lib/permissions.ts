import { AccessStatus, Role, User } from "@prisma/client";
import crypto from "crypto";
import { headers } from "next/headers";
import { AppError } from "./errors";
import { prisma } from "./prisma";
import { supabaseAdmin } from "./supabase/admin";
import { createClient as createServerSupabaseClient } from "./supabase/server";
import { verifySupabaseToken } from "./supabase/token";

export type ElderAccessType = "SELF" | "DOCTOR" | "CARETAKER" | "FAMILY" | null;

export interface AuthenticatedUser extends User {}

// Short-lived (15s) in-memory session cache to avoid redundant Supabase Auth HTTPS roundtrips on rapid concurrent requests
interface CachedAuth {
  user: AuthenticatedUser;
  expiresAt: number;
}
const authMemoryCache = new Map<string, CachedAuth>();

export function clearAuthCache() {
  authMemoryCache.clear();
}

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
  const cookieHeader = headersList.get("cookie") || "";

  // Compute collision-proof cryptographic cache key
  let cacheKey: string | null = null;
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const rawToken = authHeader.slice(7).trim();
    if (rawToken) {
      cacheKey = `bearer:${crypto.createHash("sha256").update(rawToken).digest("hex")}`;
    }
  } else if (cookieHeader) {
    const match = cookieHeader.match(/sb-[a-zA-Z0-9_-]+-auth-token=([^;]+)/);
    if (match && match[1]) {
      cacheKey = `cookie:${crypto.createHash("sha256").update(match[1]).digest("hex")}`;
    }
  }

  // Check cache (instant 0ms return for concurrent requests on the same page)
  if (cacheKey && authMemoryCache.has(cacheKey)) {
    const cached = authMemoryCache.get(cacheKey)!;
    if (Date.now() < cached.expiresAt && cached.user.isActive) {
      if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(cached.user.role)) {
        throw AppError.forbidden(
          `Access denied: requires one of [${allowedRoles.join(", ")}] role`
        );
      }
      return cached.user;
    }
  }

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

  // Cache authenticated session for 15s
  if (cacheKey) {
    if (authMemoryCache.size > 500) authMemoryCache.clear();
    authMemoryCache.set(cacheKey, { user, expiresAt: Date.now() + 15000 });
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
