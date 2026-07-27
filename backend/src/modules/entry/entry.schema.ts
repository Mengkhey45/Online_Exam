import { z } from "zod";

/** Student entry (AGENTS §7). Public — a keyless student has no account yet. */
export const entryKeyParams = z.object({ key: z.string().min(1).max(20) });
export const entryExamIdParams = z.object({ id: z.string() });

/** The confirmed details a student submits to start the sitting. */
export const startAttemptSchema = z.object({
  details: z.record(z.string(), z.string().max(300)).default({}),
});

export type StartAttemptInput = z.infer<typeof startAttemptSchema>;
