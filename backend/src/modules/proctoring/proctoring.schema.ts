import { z } from "zod";
import { proctoringEventSchema } from "@/schema";

export const ingestEventsSchema = z.object({
  events: z.array(proctoringEventSchema),
});

export const incidentSchema = z.object({
  note: z.string().max(2000).default(""),
});

export const attemptIdParams = z.object({ id: z.string() });

export type IngestEventsInput = z.infer<typeof ingestEventsSchema>;
export type IncidentInput = z.infer<typeof incidentSchema>;
