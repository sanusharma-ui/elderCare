import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  getClientIp,
  getRateLimitHeaders,
  RATE_LIMIT_PRESETS,
  RateLimitResult,
} from "./lib/rate-limit";

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(), geolocation=(), browsing-topics=()"
  );
  if (process.env.NODE_ENV === "production") {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }
  return res;
}

function createRateLimitErrorResponse(rl: RateLimitResult): NextResponse {
  const headers = getRateLimitHeaders(rl);
  const res = NextResponse.json(
    {
      ok: false,
      error: {
        code: "TOO_MANY_ATTEMPTS",
        message: `Too many requests. Please wait ${rl.retryAfter} seconds before trying again.`,
        details: { retryAfter: rl.retryAfter },
      },
    },
    { status: 429, headers }
  );
  return applySecurityHeaders(res);
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. API Route Gate: Enforce Rate Limiting & CSRF Checks
  if (pathname.startsWith("/api")) {
    const clientIp = getClientIp(request);

    // Targeted Rate Limiting
    if (pathname === "/api/auth/login") {
      const rl = checkRateLimit(
        `rl:login:${clientIp}`,
        RATE_LIMIT_PRESETS.AUTH_LOGIN.limit,
        RATE_LIMIT_PRESETS.AUTH_LOGIN.windowSeconds
      );
      if (!rl.allowed) return createRateLimitErrorResponse(rl);
    } else if (pathname === "/api/auth/register") {
      const rl = checkRateLimit(
        `rl:register:${clientIp}`,
        RATE_LIMIT_PRESETS.AUTH_REGISTER.limit,
        RATE_LIMIT_PRESETS.AUTH_REGISTER.windowSeconds
      );
      if (!rl.allowed) return createRateLimitErrorResponse(rl);
    } else if (pathname === "/api/invites/redeem") {
      const rl = checkRateLimit(
        `rl:redeem:${clientIp}`,
        RATE_LIMIT_PRESETS.INVITE_REDEEM.limit,
        RATE_LIMIT_PRESETS.INVITE_REDEEM.windowSeconds
      );
      if (!rl.allowed) return createRateLimitErrorResponse(rl);
    } else if (!pathname.startsWith("/api/cron") && pathname !== "/api/health") {
      // General API Rate Limit per IP (150 req/min)
      const rl = checkRateLimit(
        `rl:api:${clientIp}`,
        RATE_LIMIT_PRESETS.GLOBAL_API.limit,
        RATE_LIMIT_PRESETS.GLOBAL_API.windowSeconds
      );
      if (!rl.allowed) return createRateLimitErrorResponse(rl);
    }

    // CSRF Protection on mutating requests (POST, PATCH, DELETE, PUT)
    // Excludes cron jobs which authenticate via Bearer token
    if (
      ["POST", "PATCH", "DELETE", "PUT"].includes(request.method) &&
      !pathname.startsWith("/api/cron")
    ) {
      const origin = request.headers.get("origin");
      const host = request.headers.get("host");
      if (origin && host) {
        try {
          const originHost = new URL(origin).host;
          if (originHost !== host && !originHost.endsWith(host)) {
            return applySecurityHeaders(
              NextResponse.json(
                {
                  ok: false,
                  error: {
                    code: "FORBIDDEN",
                    message: "Cross-site request forgery protection: origin mismatch",
                  },
                },
                { status: 403 }
              )
            );
          }
        } catch {
          // Invalid origin header format
        }
      }
    }

    // API routes proceed with their own fast, cryptographically validated requireAuth()
    const apiResponse = NextResponse.next({ request });
    return applySecurityHeaders(apiResponse);
  }

  // 2. Page Navigations: Security Headers & Supabase Session Refresh
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return applySecurityHeaders(supabaseResponse);
  }

  // Only refresh token if Supabase auth cookies are present
  const allCookies = request.cookies.getAll();
  const hasAuthToken = allCookies.some(
    (c) => c.name.startsWith("sb-") && c.name.includes("-auth-token")
  );

  if (!hasAuthToken) {
    return applySecurityHeaders(supabaseResponse);
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: Array<{
          name: string;
          value: string;
          options?: Parameters<typeof supabaseResponse.cookies.set>[2];
        }>
      ) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, {
            ...options,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
          })
        );
      },
    },
  });

  // Refresh auth token by reading user only for authenticated page navigations
  await supabase.auth.getUser();

  return applySecurityHeaders(supabaseResponse);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
