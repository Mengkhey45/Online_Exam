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
 * Team management is owned by an organisation administrator. Teachers can
 * collaborate on exams but may not alter institutional membership.
 */
export const teamRouter: Router = Router();

teamRouter.get("/team", requireRole("admin"), async (req, res) => {
  res.json({ members: await listTeam(requireCtx(req)) });
});

teamRouter.post(
  "/team/invite",
  requireRole("admin"),
  validate(inviteSchema),
  async (req, res) => {
    const input = validated<InviteInput>(req);
    res.status(201).json(await inviteTeacher(requireCtx(req), input));
  },
);

teamRouter.delete(
  "/team/:id",
  requireRole("admin"),
  validate(memberIdParams, "params"),
  async (req, res) => {
    const { id } = validated<{ id: string }>(req, "params");
    res.json(await removeMember(requireCtx(req), id));
  },
);
