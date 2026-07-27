import { z } from "zod";

// The client completes Google OAuth via Supabase, then hands the backend the
// verified access token to establish a session cookie (AGENTS §6).
export const googleCallbackSchema = z.object({
  accessToken: z.string().min(10),
});

export type GoogleCallbackInput = z.infer<typeof googleCallbackSchema>;
