import { z } from "zod";

/** Invite a colleague into the organisation (AGENTS §6). */
export const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200),
  // Only teachers/admins are invited this way; students enter with an exam key.
  role: z.enum(["teacher", "admin"]).default("teacher"),
});

export const memberIdParams = z.object({ id: z.string() });

export type InviteInput = z.infer<typeof inviteSchema>;
