/**
 * Attempt-session token storage (AGENTS §7 student entry). A keyless student
 * gets a token from start-attempt that authorises only their sitting. We keep
 * it in sessionStorage keyed by attempt id so it survives the navigation into
 * /sit/[attemptId] and a reload, but is gone when the tab closes. It is not a
 * general credential — never send it to teacher routes.
 */
const KEY = (attemptId: string) => `examroom.attempt-token.${attemptId}`;

export function storeAttemptToken(attemptId: string, token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY(attemptId), token);
  } catch {
    // Private-mode / storage-disabled: the sitting page will 401 and show its
    // error state rather than crash here.
  }
}

export function getAttemptToken(attemptId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(KEY(attemptId));
  } catch {
    return null;
  }
}
