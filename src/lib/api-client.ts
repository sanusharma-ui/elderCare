import enMessages from "@/messages/en.json";
import hiMessages from "@/messages/hi.json";
import mrMessages from "@/messages/mr.json";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_CREDENTIALS"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "INVITE_INVALID"
  | "INVITE_EXPIRED"
  | "INVITE_ALREADY_USED"
  | "TOO_MANY_ATTEMPTS"
  | "DOSE_WINDOW_CLOSED"
  | "DOSE_NOT_MARKABLE"
  | "UNDO_WINDOW_EXPIRED"
  | "AI_RATE_LIMITED"
  | "AI_UNAVAILABLE"
  | "USER_DEACTIVATED"
  | "CONFLICT"
  | "INTERNAL_SERVER_ERROR";

export class ApiError extends Error {
  code: ApiErrorCode;
  details?: unknown;
  status: number;

  constructor(code: ApiErrorCode, message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function getLocalizedErrorMessage(code: string, locale: "en" | "hi" | "mr" = "hi"): string {
  const dictionary = locale === "en" ? enMessages : locale === "mr" ? mrMessages : hiMessages;
  const errors = dictionary.errors as Record<string, string>;
  return errors[code] || dictionary.errors.INTERNAL_SERVER_ERROR;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  const config: RequestInit = {
    ...options,
    headers,
    credentials: "same-origin", // Pass Supabase auth cookies automatically
  };

  const response = await fetch(url, config);

  // Handle 401 Unauthorized
  if (response.status === 401) {
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
    }
  }

  let body: any;
  try {
    body = await response.json();
  } catch {
    throw new ApiError(
      "INTERNAL_SERVER_ERROR",
      "Network error or invalid server response",
      response.status
    );
  }

  if (!body.ok) {
    const errObj = body.error || {};
    const code = (errObj.code || "INTERNAL_SERVER_ERROR") as ApiErrorCode;
    const msg = errObj.message || getLocalizedErrorMessage(code);
    throw new ApiError(code, msg, response.status, errObj.details);
  }

  return body.data as T;
}
