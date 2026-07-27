import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api/client";

/**
 * The roster "directory": batches (backend "classes") and students. Separate
 * from the import wizard in queries.ts — this is the everyday view of who's in
 * the roster and manual entry (AGENTS §6). No AI, no files.
 */

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "1";

export const batchSchema = z.object({ id: z.string(), name: z.string() });
export type Batch = z.infer<typeof batchSchema>;
const batchesSchema = z.object({ classes: z.array(batchSchema) });

export const studentSchema = z.object({
  id: z.string(),
  classId: z.string().nullable(),
  studentRef: z.string(),
  name: z.string(),
  email: z.string(),
  program: z.string().nullable(),
});
export type Student = z.infer<typeof studentSchema>;
const studentsSchema = z.object({ students: z.array(studentSchema) });

export const rosterKeys = {
  batches: ["roster", "batches"] as const,
  students: ["roster", "students"] as const,
};

export function useBatches() {
  return useQuery({
    queryKey: rosterKeys.batches,
    queryFn: async () => {
      if (USE_MOCKS) return { classes: [] as Batch[] };
      return api.get("/classes", batchesSchema);
    },
  });
}

export function useCreateBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string): Promise<Batch> => {
      if (USE_MOCKS) return { id: "cls_mock", name };
      return api.post("/classes", { name }, batchSchema);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: rosterKeys.batches }),
  });
}

export function useStudents() {
  return useQuery({
    queryKey: rosterKeys.students,
    queryFn: async () => {
      if (USE_MOCKS) return { students: [] as Student[] };
      return api.get("/students", studentsSchema);
    },
  });
}

export type AddStudentInput = {
  classId?: string;
  studentRef: string;
  name: string;
  email: string;
  program?: string;
};

export function useAddStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddStudentInput): Promise<Student> => {
      if (USE_MOCKS) {
        return {
          id: "std_mock",
          classId: input.classId ?? null,
          studentRef: input.studentRef,
          name: input.name,
          email: input.email,
          program: input.program ?? null,
        };
      }
      return api.post("/students", input, studentSchema);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: rosterKeys.students }),
  });
}

const removeAckSchema = z.object({ removed: z.boolean() });

export function useRemoveStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (USE_MOCKS) return { removed: true };
      return api.delete(`/students/${id}`, removeAckSchema);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: rosterKeys.students }),
  });
}
