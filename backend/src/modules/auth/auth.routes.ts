import { Router } from "express";
import { validate, validated } from "@/middleware/validate";
import { requireCtx } from "@/middleware/context";
import { isProd } from "@/config/env";
import {
  googleCallbackSchema,
  type GoogleCallbackInput,
} from "./auth.schema";
import { completeGoogleCallback, getMe } from "./auth.service";

// Public — runs before the authenticate middleware.
export const authPublicRouter: Router = Router();

authPublicRouter.post(
  "/auth/google/callback",
  validate(googleCallbackSchema),
  async (req, res) => {
    const { accessToken } = validated<GoogleCallbackInput>(req);
    const profile = await completeGoogleCallback(accessToken);
    res.cookie("sb-access-token", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      maxAge: 60 * 60 * 1000,
    });
    res.json(profile);
  },
);

// Protected — runs after authenticate.
export const authRouter: Router = Router();

authRouter.get("/auth/me", async (req, res) => {
  res.json(await getMe(requireCtx(req)));
});

authRouter.post("/auth/logout", (_req, res) => {
  res.clearCookie("sb-access-token");
  res.status(204).end();
});
