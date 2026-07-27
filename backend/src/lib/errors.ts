/**
 * Typed application errors (AGENTS §9). Services throw these; middleware/error.ts
 * maps them to the response shape { error: { code, message, details } }. Never
 * send a raw stack trace.
 */
export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (code: string, message: string, details?: unknown) =>
  new AppError(400, code, message, details);

export const unauthorized = (message = "Not authenticated") =>
  new AppError(401, "UNAUTHENTICATED", message);

export const forbidden = (message = "Not allowed") =>
  new AppError(403, "FORBIDDEN", message);

export const notFound = (message = "Not found") =>
  new AppError(404, "NOT_FOUND", message);

export const conflict = (code: string, message: string, details?: unknown) =>
  new AppError(409, code, message, details);

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError;
}
