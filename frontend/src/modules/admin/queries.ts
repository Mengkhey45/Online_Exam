import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api/client";

export const organizationDashboardSchema = z.object({
  teachers: z.number().int().nonnegative(),
  classes: z.number().int().nonnegative(),
  students: z.number().int().nonnegative(),
  exams: z.number().int().nonnegative(),
});

export function useOrganizationDashboard() {
  return useQuery({
    queryKey: ["organization", "dashboard"],
    queryFn: ({ signal }) => api.get("/organization/dashboard", organizationDashboardSchema, signal),
  });
}
