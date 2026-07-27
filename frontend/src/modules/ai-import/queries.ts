import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api/client";
import { supabase } from "@/lib/supabase/client";
import {
  conversionSchema,
  createdImportSchema,
  uploadUrlSchema,
  type Conversion,
} from "./schema";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "1";
const BUCKET = "exam-pdfs";

export const importKeys = {
  detail: (examId: string) => ["conversion", examId] as const,
};

async function fetchConversion(
  examId: string,
  signal?: AbortSignal,
): Promise<Conversion> {
  if (USE_MOCKS) {
    const { mockConversion } = await import("./mocks");
    await new Promise((r) => setTimeout(r, 300));
    return mockConversion;
  }
  return api.get(`/exams/${examId}/conversion`, conversionSchema, signal);
}

export function useConversion(examId: string) {
  return useQuery({
    queryKey: importKeys.detail(examId),
    queryFn: ({ signal }) => fetchConversion(examId, signal),
    // Surface "no import yet" (404) immediately rather than retrying — the view
    // shows the upload dropzone in that case.
    retry: false,
    // While the worker is still converting, poll until it finishes (§8).
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "pending" || status === "processing" ? 2500 : false;
    },
  });
}

const ackSchema = z.object({ ok: z.boolean() });

/** Apply the reviewed conversion into the exam draft (rule 3.6 — explicit). */
export function useApplyConversion(examId: string) {
  return useMutation({
    mutationFn: async (input: {
      reviewedBlockIds: string[];
      discardedPageIds: string[];
    }) => {
      if (USE_MOCKS) {
        await new Promise((r) => setTimeout(r, 400));
        return { ok: true };
      }
      return api.post(`/exams/${examId}/conversion/apply`, input, ackSchema);
    },
  });
}

/**
 * Start a PDF import (AGENTS §8): get a signed upload URL, upload the file to
 * storage with the caller's session, then enqueue the conversion job. The
 * worker converts pages in the background; the review screen polls until done.
 */
export function useStartPdfImport(examId: string) {
  return useMutation({
    mutationFn: async (file: File) => {
      if (USE_MOCKS) {
        await new Promise((r) => setTimeout(r, 600));
        return { importId: "imp_mock" };
      }
      // 1. Ask the backend for a signed upload URL (it uses our JWT, §10).
      const upload = await api.post(
        "/uploads/exam-pdf",
        { filename: file.name },
        uploadUrlSchema,
      );
      // 2. Upload the PDF straight to storage.
      const { error } = await supabase.storage
        .from(BUCKET)
        .uploadToSignedUrl(upload.path, upload.token, file);
      if (error) throw new Error(error.message);
      // 3. Enqueue the conversion job against the target exam.
      return api.post(
        "/imports",
        { filename: file.name, sourceUrl: upload.path, examId },
        createdImportSchema,
      );
    },
  });
}
