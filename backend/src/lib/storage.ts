import { createClient } from "@supabase/supabase-js";
import { env } from "@/config/env";

/**
 * Supabase Storage access for exam PDFs.
 * - The API server signs upload URLs using the ANON key + the caller's JWT, so
 *   RLS storage policies apply and the service-role key never touches the API
 *   (AGENTS §10).
 * - The worker downloads with the service-role key (AGENTS §8) — it already
 *   carries a verified organization_id and scopes its own writes.
 */
const BUCKET = "exam-pdfs";

export function userStorage(userJwt: string) {
  const client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${userJwt}` } },
    auth: { persistSession: false },
  });
  return client.storage.from(BUCKET);
}

/** Worker-only: bypasses RLS via the service-role key. */
export function serviceStorage() {
  const client = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );
  return client.storage.from(BUCKET);
}

/** Download an uploaded PDF as bytes (worker side). */
export async function downloadPdf(path: string): Promise<Uint8Array> {
  const { data, error } = await serviceStorage().download(path);
  if (error || !data) {
    throw new Error(`Could not download ${path}: ${error?.message ?? "no data"}`);
  }
  return new Uint8Array(await data.arrayBuffer());
}
