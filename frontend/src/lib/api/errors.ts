/**
 * A typed failure from the API layer. Every network/validation problem becomes
 * one of these so callers can surface an inline message or toast — never an
 * unhandled throw that crashes the UI (AGENTS §8).
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly detail?: unknown;

  constructor(params: {
    status: number;
    code: string;
    message: string;
    detail?: unknown;
  }) {
    super(params.message);
    this.name = "ApiError";
    this.status = params.status;
    this.code = params.code;
    this.detail = params.detail;
  }

  /** A network failure — request never reached the server (offline, DNS, CORS). */
  static network(cause?: unknown) {
    return new ApiError({
      status: 0,
      code: "network",
      message: "Can’t reach the server. Check your connection and try again.",
      detail: cause,
    });
  }

  /** The response body didn’t match the expected schema. */
  static invalidResponse(detail: unknown) {
    return new ApiError({
      status: 200,
      code: "invalid_response",
      message: "The server sent data we couldn’t read. Try again shortly.",
      detail,
    });
  }

  get isOffline() {
    return this.code === "network";
  }
}
