import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api/client";
import { dashboardSchema, type Dashboard } from "./summary";

/**
 * TanStack Query definitions for the exam module. Server data only — never used
 * for runtime answers (AGENTS §8). While the backend is unbuilt, set
 * NEXT_PUBLIC_USE_MOCKS=1 to resolve fixtures through the same schemas.
 */

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "1";

export const examKeys = {
  all: ["exams"] as const,
  dashboard: () => [...examKeys.all, "dashboard"] as const,
  detail: (id: string) => [...examKeys.all, "detail", id] as const,
};

async function fetchDashboard(signal?: AbortSignal): Promise<Dashboard> {
  if (USE_MOCKS) {
    const { mockDashboard } = await import("./mocks");
    // Simulate a little latency so loading states are exercised in dev.
    await new Promise((r) => setTimeout(r, 400));
    return mockDashboard;
  }
  return api.get("/exams/dashboard", dashboardSchema, signal);
}

export function useDashboard() {
  return useQuery({
    queryKey: examKeys.dashboard(),
    queryFn: ({ signal }) => fetchDashboard(signal),
  });
}

const createdExamSchema = z.object({ id: z.string() });
const createdGroupSchema = z.object({ id: z.string(), name: z.string() });

/** Create a draft exam in a group, then the caller opens the builder (§6). */
export function useCreateExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { groupId: string; title: string }) => {
      if (USE_MOCKS) {
        await new Promise((r) => setTimeout(r, 300));
        return { id: "exm_new" };
      }
      return api.post("/exams", input, createdExamSchema);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: examKeys.dashboard() }),
  });
}

/** Create an exam group (a course/cohort card on the dashboard). */
export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string }) => {
      if (USE_MOCKS) {
        await new Promise((r) => setTimeout(r, 300));
        return { id: "grp_new", name: input.name };
      }
      return api.post("/exam-groups", input, createdGroupSchema);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: examKeys.dashboard() }),
  });
}
