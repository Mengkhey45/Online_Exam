import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

/**
 * Validate a request part with a Zod schema (AGENTS §3.7, §9). The parsed,
 * typed value replaces the raw one. Use on every route with a body or params.
 */
type Part = "body" | "params" | "query";

export function validate(schema: ZodType, part: Part = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      next(result.error);
      return;
    }
    // Store the validated value; handlers read it via validated(req, part).
    (req as Request & { validated?: Record<Part, unknown> }).validated ??= {
      body: undefined,
      params: undefined,
      query: undefined,
    };
    (req as Request & { validated: Record<Part, unknown> }).validated[part] =
      result.data;
    next();
  };
}

/** Read a previously validated part with its inferred type. */
export function validated<T>(req: Request, part: Part = "body"): T {
  return (req as Request & { validated: Record<Part, T> }).validated[part];
}
