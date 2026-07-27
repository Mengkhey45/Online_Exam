import { Router } from "express";
import { validate, validated } from "@/middleware/validate";
import { requireCtx } from "@/middleware/context";
import { requireRole } from "@/middleware/auth";
import {
  inviteSchema,
  memberIdParams,
  type InviteInput,
} from "./team.schema";
import { inviteTeacher, listTeam, removeMember } from "./team.service";

/**
 * Team management (AGENTS §6). Teachers/admins can see the org's members and
 * invite colleagues; students never reach these routes.
 */
export const teamRouter: Router = Router();

teamRouter.get("/team", requireRole("admin", "teacher"), async (req, res) => {
  res.json({ members: await listTeam(requireCtx(req)) });
});

teamRouter.post(
  "/team/invite",
  requireRole("admin", "teacher"),
  validate(inviteSchema),
  async (req, res) => {
    const input = validated<InviteInput>(req);
    res.status(201).json(await inviteTeacher(requireCtx(req), input));
  },
);

teamRouter.delete(
  "/team/:id",
  requireRole("admin", "teacher"),
  validate(memberIdParams, "params"),
  async (req, res) => {
    const { id } = validated<{ id: string }>(req, "params");
    res.json(await removeMember(requireCtx(req), id));
  },
);
