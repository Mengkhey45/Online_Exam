import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api/client";
import { supabase } from "@/lib/supabase/client";
import { stagedImportSchema, type StagedImport } from "./schema";

/**
 * AI roster scan (Phase 2). Upload a photo/scan/PDF, the worker extracts rows
 * into the SAME staging the CSV import uses, then the teacher reviews/confirms
 * with the existing PreviewStep. Needs the backend to have an AI key + worker.
 */
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "1";
const BUCKET = "exam-pdfs";

const uploadUrlSchema = z.object({
  path: z.string(),
  token: z.string(),
  signedUrl: z.string(),
});
const scanCreatedSchema = z.object({ importId: z.string(), status: z.string() });

export function useRosterScan() {
  return useMutation({
    mutationFn: async (input: {
      file: File;
      prompt: string;
      classId?: string;
    }): Promise<{ importId: string }> => {
      if (USE_MOCKS) {
        await new Promise((r) => setTimeout(r, 600));
        return { importId: "imp_mock" };
      }
      const upload = await api.post(
        "/roster/uploads/scan",
        { filename: input.file.name },
        uploadUrlSchema,
      );
      const { error } = await supabase.storage
        .from(BUCKET)
        .uploadToSignedUrl(upload.path, upload.token, input.file);
      if (error) throw new Error(error.message);
      return api.post(
        "/roster/scan",
        {
          filename: input.file.name,
          sourceUrl: upload.path,
          prompt: input.prompt,
          classId: input.classId,
        },
        scanCreatedSchema,
      );
    },
  });
}

/** Poll the roster import until the worker finishes extracting (§8). */
export function useRosterImport(importId: string | null) {
  return useQuery({
    queryKey: ["roster-import", importId],
    enabled: Boolean(importId),
    queryFn: (): Promise<StagedImport> =>
      api.get(`/roster/imports/${importId}`, stagedImportSchema),
    refetchInterval: (query) =>
      query.state.data?.status === "processing" ? 2500 : false,
  });
}
