import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters").max(72),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Passwords don’t match",
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
