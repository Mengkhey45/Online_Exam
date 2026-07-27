/** Public surface of the auth module (Kanha §6). Import from here only. */
export { authPublicRouter, authRouter } from "./auth.routes";
export { getMe, completeGoogleCallback } from "./auth.service";
