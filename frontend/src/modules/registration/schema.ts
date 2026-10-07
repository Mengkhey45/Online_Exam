import { z } from "zod";

export const registrationInputSchema = z.object({
  organizationName: z.string().min(2, "Enter your organization name").max(200),
  adminName: z.string().min(2, "Enter your full name").max(200),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters").max(72),
});

export type RegistrationInput = z.infer<typeof registrationInputSchema>;

export const registrationResultSchema = z.object({
  organizationId: z.string(),
  organizationName: z.string(),
  slug: z.string(),
  userId: z.string(),
  role: z.literal("admin"),
});
