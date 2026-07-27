import { useQuery } from "@tanstack/react-query";
import { bankQuestionSchema, type BankQuestion } from "./schema";

/**
 * Question bank data. There is no backend endpoint yet, so this resolves
 * fixtures (validated through the schema) regardless of NEXT_PUBLIC_USE_MOCKS.
 * When a `bank` API lands, swap the queryFn for api.get("/bank/questions", …).
 */
async function fetchBank(): Promise<BankQuestion[]> {
  const { mockBankQuestions } = await import("./mocks");
  await new Promise((r) => setTimeout(r, 250));
  return mockBankQuestions;
}

export function useQuestionBank() {
  return useQuery({
    queryKey: ["bank", "questions"],
    queryFn: fetchBank,
  });
}

export { bankQuestionSchema };
