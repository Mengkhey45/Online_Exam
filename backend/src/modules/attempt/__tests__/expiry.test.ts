import { describe, expect, it } from "vitest";
import { isPastDeadline, isPastGrace, SUBMIT_GRACE_MS } from "../expiry";

// Time-limit enforcement (AGENTS §7): the server closes an attempt once its
// deadline plus a short grace has passed, even if the browser never submits.
describe("attempt expiry", () => {
  const expiresAt = new Date("2026-11-18T10:00:00Z");
  const t = expiresAt.getTime();

  it("is open before the deadline", () => {
    expect(isPastDeadline({ expiresAt }, t - 1)).toBe(false);
    expect(isPastGrace({ expiresAt }, t - 1)).toBe(false);
  });

  it("allows the final sync + submit during the grace period", () => {
    expect(isPastDeadline({ expiresAt }, t + 1)).toBe(true);
    expect(isPastGrace({ expiresAt }, t + SUBMIT_GRACE_MS)).toBe(false);
  });

  it("closes once the grace period is over", () => {
    expect(isPastGrace({ expiresAt }, t + SUBMIT_GRACE_MS + 1)).toBe(true);
  });
});
