import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, ErrorCode } from "./errors";

export interface ApiSuccessResponse<T> {
  ok: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  ok: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

export function successResponse<T>(
  data: T,
  meta?: Record<string, unknown>,
  status: number = 200
) {
  const body: ApiSuccessResponse<T> = {
    ok: true,
    data,
  };
  if (meta !== undefined) {
    body.meta = meta;
  }
  return NextResponse.json(body, { status });
}

export function errorResponse(
  code: ErrorCode,
  message: string,
  details?: unknown,
  status: number = 400
) {
  const body: ApiErrorResponse = {
    ok: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };
  return NextResponse.json(body, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return errorResponse(error.code, error.message, error.details, error.statusCode);
  }

  if (error instanceof ZodError) {
    const formattedErrors = error.errors.map((err) => ({
      path: err.path.join("."),
      message: err.message,
      code: err.code,
    }));
    return errorResponse(
      "VALIDATION_ERROR",
      "Request validation failed",
      formattedErrors,
      422
    );
  }

  console.error("Unhandled API Error:", error);
  const isDev = process.env.NODE_ENV === "development";
  const safeMessage = isDev
    ? (error instanceof Error ? error.message : "An unexpected internal error occurred")
    : "An unexpected internal server error occurred. Please try again later.";
  return errorResponse(
    "INTERNAL_SERVER_ERROR",
    safeMessage,
    isDev ? error : undefined,
    500
  );
}
