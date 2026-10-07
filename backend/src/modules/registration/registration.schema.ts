import { z } from "zod";

export const registerOrganizationSchema = z.object({
  organizationName: z.string().min(2).max(200),
  adminName: z.string().min(2).max(200),
});

export type RegisterOrganizationInput = z.infer<typeof registerOrganizationSchema>;
