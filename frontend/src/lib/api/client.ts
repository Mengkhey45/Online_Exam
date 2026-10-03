import { z } from "zod";
import { ApiError } from "./errors";

/**
 * The one place the frontend talks to the Express backend. No bare `fetch` in
 * components (AGENTS §8). Every response is parsed with a Zod schema before it
 * is handed back, so callers always receive validated data or an ApiError.
 *
 * The backend is a separate server; this app never touches a database.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

// The current Supabase access token, kept in sync by the auth provider and
// attached as a Bearer token on every request.
let accessToken: string | null = null;

export function setApiAccessToken(token: string | null): void {
  accessToken = token;
}

type RequestOptions<T> = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  schema: z.ZodType<T>;
  signal?: AbortSignal;
  /** Extra headers (auth is attached by the caller / interceptor). */
  headers?: Record<string, string>;
  /**
   * A token to use for THIS request instead of the global Supabase token — the
   * student sitting uses its attempt token here, so it isn't clobbered by the
   * teacher session the AuthProvider keeps in `accessToken` (AGENTS §7).
   */
  authToken?: string;
};

const errorBodySchema = z.object({
  code: z.string().optional(),
  message: z.string().optional(),
  error: z
    .object({
      code: z.string().optional(),
      message: z.string().optional(),
    })
    .optional(),
});

async function request<T>(path: string, opts: RequestOptions<T>): Promise<T> {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(opts.body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
        ...((opts.authToken ?? accessToken)
          ? { Authorization: `Bearer ${opts.authToken ?? accessToken}` }
          : {}),
        ...opts.headers,
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
      credentials: "include",
    });
  } catch (cause) {
    throw ApiError.network(cause);
  }

  if (!res.ok) {
    let parsed: z.infer<typeof errorBodySchema> = {};
    try {
      parsed = errorBodySchema.parse(await res.json());
    } catch {
      // Non-JSON error body — fall through with defaults.
    }
    throw new ApiError({
      status: res.status,
      code: parsed.error?.code ?? parsed.code ?? `http_${res.status}`,
      message:
        parsed.error?.message ?? parsed.message ?? defaultMessageForStatus(res.status),
    });
  }

  // 204 / empty body — validate against schema (callers use z.void() etc).
  const text = await res.text();
  const json = text ? JSON.parse(text) : undefined;

  const result = opts.schema.safeParse(json);
  if (!result.success) {
    throw ApiError.invalidResponse(result.error.flatten());
  }
  return result.data;
}

function defaultMessageForStatus(status: number): string {
  if (status === 401) return "Your session has expired. Sign in again.";
  if (status === 403) return "You don’t have access to this.";
  if (status === 404) return "We couldn’t find what you were looking for.";
  if (status >= 500) return "The server ran into a problem. Try again shortly.";
  return "Something went wrong with that request.";
}

export const api = {
  get: <T>(
    path: string,
    schema: z.ZodType<T>,
    signal?: AbortSignal,
    authToken?: string,
  ) => request(path, { method: "GET", schema, signal, authToken }),
  post: <T>(
    path: string,
    body: unknown,
    schema: z.ZodType<T>,
    authToken?: string,
  ) => request(path, { method: "POST", body, schema, authToken }),
  put: <T>(
    path: string,
    body: unknown,
    schema: z.ZodType<T>,
    authToken?: string,
  ) => request(path, { method: "PUT", body, schema, authToken }),
  patch: <T>(path: string, body: unknown, schema: z.ZodType<T>) =>
    request(path, { method: "PATCH", body, schema }),
  delete: <T>(path: string, schema: z.ZodType<T>) =>
    request(path, { method: "DELETE", schema }),
};
