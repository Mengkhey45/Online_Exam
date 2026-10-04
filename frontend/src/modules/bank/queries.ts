import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api/client";
import type { Block } from "@/modules/exam";
import { bankQuestionSchema, type BankQuestion } from "./schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const bankCreateAckSchema = z.object({ id: z.string() });
const bankAckSchema = z.object({ ok: z.boolean() });

/**
 * Organization-scoped reusable questions. The API returns full block content
 * so copying into an exam can create an independent snapshot.
 */
async function fetchBank(signal?: AbortSignal): Promise<BankQuestion[]> {
  return api.get("/bank/questions", z.array(bankQuestionSchema), signal);
}

export function useQuestionBank() {
  return useQuery({
    queryKey: ["bank", "questions"],
    queryFn: ({ signal }) => fetchBank(signal),
  });
}

export function useCreateBankQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { bankName: string; difficulty: "easy" | "medium" | "hard"; block: Block }) =>
      api.post("/bank/questions", input, bankCreateAckSchema),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bank", "questions"] }),
  });
}

export function useUpdateBankQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; bankName?: string; difficulty?: "easy" | "medium" | "hard"; block?: Block }) => api.patch(`/bank/questions/${input.id}`, { bankName: input.bankName, difficulty: input.difficulty, block: input.block }, bankAckSchema),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bank", "questions"] }),
  });
}

export function useDeleteBankQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/bank/questions/${id}`, bankAckSchema),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bank", "questions"] }),
  });
}

export function useRenameBank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { oldName: string; name: string }) => api.patch(`/bank/banks/${encodeURIComponent(input.oldName)}`, { name: input.name }, bankAckSchema),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bank", "questions"] }),
  });
}

export function useDeleteBank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.delete(`/bank/banks/${encodeURIComponent(name)}`, bankAckSchema),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bank", "questions"] }),
  });
}

export { bankQuestionSchema };
