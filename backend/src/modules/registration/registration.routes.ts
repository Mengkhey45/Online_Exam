import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { validate, validated } from "@/middleware/validate";
import { registerOrganizationSchema, type RegisterOrganizationInput } from "./registration.schema";
import { registerOrganization } from "./registration.service";

export const registrationRouter: Router = Router();

const registrationLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Try again in an hour." } },
});

registrationRouter.post(
  "/public/organizations/register",
  registrationLimit,
  validate(registerOrganizationSchema),
  async (req, res) => {
    const header = req.headers.authorization;
    const accessToken = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    const input = validated<RegisterOrganizationInput>(req);
    res.status(201).json(await registerOrganization(accessToken, input));
  },
);
