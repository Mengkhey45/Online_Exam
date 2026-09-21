import { z } from "zod";

/** Org members (AGENTS §6). A pending member has not confirmed the invite. */
export const memberSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: z.string(),
  status: z.enum(["active", "pending"]),
});
export type Member = z.infer<typeof memberSchema>;

export const teamSchema = z.object({ members: z.array(memberSchema) });
export type Team = z.infer<typeof teamSchema>;

export const inviteInputSchema = z.object({
  email: z.string().email("Enter a valid email"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["teacher", "admin"]),
});
export type InviteInput = z.infer<typeof inviteInputSchema>;
