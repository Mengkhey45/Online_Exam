import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError, isAppError } from "@/lib/errors";
import { logger } from "@/lib/logger";

/**
 * Central error handler (AGENTS §9). Maps typed errors to the response shape
 * { error: { code, message, details } }. Never sends a raw stack trace.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const base = {
    requestId: req.requestId,
    organizationId: req.ctx?.organizationId,
  };

  if (isAppError(err)) {
    if (err.status >= 500) logger.error({ ...base, err }, err.message);
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed.",
        details: err.flatten(),
      },
    });
    return;
  }

  logger.error({ ...base, err }, "Unhandled error");
  res.status(500).json({
    error: { code: "INTERNAL", message: "Something went wrong." },
  });
}

/** 404 for unmatched routes. */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: "Route not found." },
  });
}

export { AppError };
