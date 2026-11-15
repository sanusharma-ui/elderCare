import { NextRequest } from "next/server";
import { AppError } from "./errors";

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number; // Unix timestamp in seconds
  retryAfter: number; // Seconds until reset
}

interface WindowRecord {
  count: number;
  resetAt: number; // Milliseconds
}

// In-memory sliding window counter store
const rateLimitStore = new Map<string, WindowRecord>();

// Run automatic prune every 60 seconds to prevent memory leaks
let cleanupTimer: NodeJS.Timeout | null = null;
function ensureCleanupTimer() {
  if (cleanupTimer || typeof setInterval === "undefined") return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 60000);
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }
}
ensureCleanupTimer();

/**
 * Extracts client IP safely from request headers, accounting for proxies/Cloudflare/Vercel.
 */
export function getClientIp(req: NextRequest | Request): string {
  const headers = req.headers;

  // Cloudflare
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  // Standard X-Forwarded-For (take the first/client IP)
  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(",")[0].trim();
    if (firstIp) return firstIp;
  }

  // Nginx / Vercel X-Real-IP
  const xRealIp = headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();

  return "127.0.0.1";
}

/**
 * Checks and increments rate limit for a given key.
 * Uses a fixed-window algorithm with automatic TTL eviction.
 *
 * @param key Unique identifier (e.g. `login:ip:1.2.3.4` or `ai:user:usr_123`)
 * @param limit Maximum allowed requests in the window
 * @param windowSeconds Window duration in seconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    // Window expired or new key
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - 1),
      resetAt: Math.ceil(resetAt / 1000),
      retryAfter: windowSeconds,
    };
  }

  // Window is active
  if (record.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt: Math.ceil(record.resetAt / 1000),
      retryAfter,
    };
  }

  // Increment counter
  record.count += 1;
  const remaining = Math.max(0, limit - record.count);
  return {
    allowed: true,
    limit,
    remaining,
    resetAt: Math.ceil(record.resetAt / 1000),
    retryAfter: Math.max(1, Math.ceil((record.resetAt - now) / 1000)),
  };
}

/**
 * Standard HTTP RateLimit headers for responses.
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.resetAt.toString(),
  };

  if (!result.allowed) {
    headers["Retry-After"] = result.retryAfter.toString();
  }

  return headers;
}

/**
 * Throws AppError.tooManyAttempts if rate limit is exceeded.
 */
export function enforceRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
  customMessage?: string
): RateLimitResult {
  const result = checkRateLimit(key, limit, windowSeconds);

  if (!result.allowed) {
    throw new AppError(
      "TOO_MANY_ATTEMPTS",
      customMessage ||
        `Rate limit exceeded. Please wait ${result.retryAfter} seconds before trying again.`,
      429,
      { retryAfter: result.retryAfter }
    );
  }

  return result;
}

// -----------------------------------------------------------------------------
// Rate Limit Presets
// -----------------------------------------------------------------------------
export const RATE_LIMIT_PRESETS = {
  // Login: 5 requests per 1 minute (anti brute-force)
  AUTH_LOGIN: { limit: 5, windowSeconds: 60 },

  // Register: 5 requests per 10 minutes (anti bot registration)
  AUTH_REGISTER: { limit: 5, windowSeconds: 600 },

  // Passcode redemption: 10 requests per 5 minutes
  INVITE_REDEEM: { limit: 10, windowSeconds: 300 },

  // Invite generation: 5 requests per 10 minutes per elder
  INVITE_CREATE: { limit: 5, windowSeconds: 600 },

  // Gemini AI calls: 20 requests per 1 hour per user
  AI_CALLS: { limit: 20, windowSeconds: 3600 },

  // Prescription scan: 6 scans per 10 minutes
  PRESCRIPTION_SCAN: { limit: 6, windowSeconds: 600 },

  // Sensitive mutations (change password, revoke, etc.): 10 per minute
  SENSITIVE_WRITE: { limit: 10, windowSeconds: 60 },

  // Standard write operations: 60 per minute
  STANDARD_WRITE: { limit: 60, windowSeconds: 60 },

  // General API global limit: 120 per minute per IP
  GLOBAL_API: { limit: 120, windowSeconds: 60 },
};
