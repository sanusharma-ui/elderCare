export type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "INVALID_CREDENTIALS"
  | "INVITE_EXPIRED"
  | "INVITE_INVALID"
  | "INVITE_ALREADY_USED"
  | "TOO_MANY_ATTEMPTS"
  | "USER_DEACTIVATED"
  | "PASSWORD_CHANGE_REQUIRED"
  | "INTERNAL_SERVER_ERROR";

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 400,
    details?: unknown
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError("BAD_REQUEST", message, 400, details);
  }

  static validation(message: string, details?: unknown) {
    return new AppError("VALIDATION_ERROR", message, 422, details);
  }

  static unauthorized(message: string = "Authentication required") {
    return new AppError("UNAUTHORIZED", message, 401);
  }

  static invalidCredentials(message: string = "Invalid email/phone or password") {
    return new AppError("INVALID_CREDENTIALS", message, 401);
  }

  static forbidden(message: string = "Access denied") {
    return new AppError("FORBIDDEN", message, 403);
  }

  static notFound(message: string = "Resource not found") {
    return new AppError("NOT_FOUND", message, 404);
  }

  static conflict(message: string, details?: unknown) {
    return new AppError("CONFLICT", message, 409, details);
  }

  static tooManyAttempts(message: string = "Too many attempts. Please try again later.") {
    return new AppError("TOO_MANY_ATTEMPTS", message, 429);
  }

  static internal(message: string = "An unexpected error occurred", details?: unknown) {
    return new AppError("INTERNAL_SERVER_ERROR", message, 500, details);
  }
}
