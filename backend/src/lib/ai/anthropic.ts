import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/config/env";

/**
 * Anthropic client for AI conversion (AGENTS §8, Choonvia's area). Lazily
 * constructed so the API server can boot without ANTHROPIC_API_KEY — only the
 * worker needs it. Never log document content or API keys (§8).
 */
let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
  client ??= new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return client;
}

/**
 * Vision-capable model for page conversion. Opus 4.8 handles high-resolution,
 * dense exam pages well. Override with CONVERSION_MODEL if a cheaper model
 * (e.g. Haiku) is preferred for high volume.
 *
 * NOTE: AGENTS §8 asks for "Temperature 0", but current models (Opus 4.8/4.7,
 * Sonnet 5, Fable 5) reject the `temperature` parameter with a 400. The same
 * goal — literal, deterministic transcription — is enforced here by the
 * transcribe-exactly system prompt and strict Zod validation with retry.
 */
export const CONVERSION_MODEL =
  process.env.CONVERSION_MODEL ?? "claude-opus-4-8";
