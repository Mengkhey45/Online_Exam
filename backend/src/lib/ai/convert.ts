import { z } from "zod";
import { blockSchema, type Block } from "@/schema";
import { getAnthropic, CONVERSION_MODEL } from "./anthropic";

/**
 * Converts a rendered exam page image into structured blocks (AGENTS §8).
 * Conversion is LITERAL — the model may fix OCR artifacts, spacing, and option
 * labels, and convert maths to LaTeX, but may not reword, "fix" grammar, or
 * change any number (rule 3.5). Output is parsed with the Zod block schema;
 * invalid output is retried by the caller, never patched into a different shape.
 */
const conversionResultSchema = z.object({
  blocks: z.array(
    blockSchema.extend({
      // The model reports its own confidence per block.
      confidence: z.enum(["high", "medium", "low"]).default("medium"),
    }),
  ),
});

const SYSTEM_PROMPT = `You transcribe a single exam page image into structured question blocks.

Rules — follow exactly:
- Transcribe the content EXACTLY as written. Do not reword, paraphrase, summarise, "fix" grammar, or change any number, symbol, or value.
- You MAY correct obvious OCR artifacts, normalise spacing, and standardise option labels (A/B/C or 1/2/3).
- Convert mathematical notation to LaTeX wrapped in $…$.
- Do not invent content that is not on the page. If part of the page is unreadable, transcribe what you can and lower your confidence.
- Identify the block type for each item: mcq, multi_select, fill_blank, short_answer, long_answer, code, file_upload, or content (for passages/instructions).
- For each block include a confidence of "high", "medium", or "low".

Output ONLY a JSON object of the form:
{"blocks": [ { "id": "...", "type": "...", "stem": "...", "marks": 0, "required": true, "options": [...], "confidence": "high" } ]}
Do not include any prose before or after the JSON.`;

export type PageConversion = z.infer<typeof conversionResultSchema>;

export async function convertPageImage(input: {
  imageBase64: string;
  mediaType: "image/png" | "image/jpeg";
}): Promise<Block[]> {
  const client = getAnthropic();

  const response = await client.messages.create({
    model: CONVERSION_MODEL,
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: input.mediaType,
              data: input.imageBase64,
            },
          },
          { type: "text", text: "Transcribe this exam page into blocks." },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Model returned no text output");
  }

  // Parse strictly. On failure the caller retries; it never patches the shape.
  const json: unknown = JSON.parse(textBlock.text);
  const parsed = conversionResultSchema.parse(json);
  return parsed.blocks;
}
