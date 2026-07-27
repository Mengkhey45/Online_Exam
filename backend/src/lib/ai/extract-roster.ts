import { z } from "zod";
import { getAnthropic, CONVERSION_MODEL } from "./anthropic";

/**
 * Extract a student roster from images (a photo/scan/PDF page of a list) using
 * the vision model (AGENTS §8). Transcription is LITERAL — it reads what's on
 * the page and never invents students. The teacher's prompt narrows what to
 * keep (e.g. "only name, email, ID; ignore marks"). Never log the extracted
 * names or the document (§9) — the caller logs job ids only.
 */
const rowSchema = z.object({
  studentRef: z.string().default(""),
  name: z.string().default(""),
  email: z.string().default(""),
});
const resultSchema = z.object({ rows: z.array(rowSchema) });
export type ExtractedRow = z.infer<typeof rowSchema>;

export type RosterImage = {
  base64: string;
  mediaType: "image/png" | "image/jpeg";
};

const SYSTEM_PROMPT = `You extract a student roster from one or more images of a printed or handwritten student list/table.

Rules — follow exactly:
- Transcribe EXACTLY what is on the page. Do not invent, guess, or add students. If a value is missing, use an empty string.
- Return one object per student. Skip header rows, section titles, totals, and blank rows.
- studentRef = the student ID / roll number / matriculation number.
- name = the student's full name.
- email = the student's email, or "" if there is none.
- Ignore any other columns (marks, grades, subject, phone, …) unless the teacher's instructions say otherwise.

Output ONLY a JSON object of the form:
{"rows": [ { "studentRef": "...", "name": "...", "email": "..." } ]}
No prose before or after the JSON.`;

export async function extractRoster(input: {
  images: RosterImage[];
  prompt?: string;
}): Promise<ExtractedRow[]> {
  const client = getAnthropic();

  const content = [
    ...input.images.map((img) => ({
      type: "image" as const,
      source: {
        type: "base64" as const,
        media_type: img.mediaType,
        data: img.base64,
      },
    })),
    {
      type: "text" as const,
      text: input.prompt?.trim()
        ? `Teacher's instructions: ${input.prompt.trim()}`
        : "Extract the student roster from these images.",
    },
  ];

  const response = await client.messages.create({
    model: CONVERSION_MODEL,
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Model returned no text output");
  }
  const json: unknown = JSON.parse(textBlock.text);
  return resultSchema.parse(json).rows;
}
