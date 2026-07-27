import { dashboardSchema, type Dashboard } from "./summary";

/**
 * Fixture data for local development while the backend is being built. Enabled
 * with NEXT_PUBLIC_USE_MOCKS=1. Everything here is validated through the real
 * Zod schemas, so the shapes stay honest against the contract.
 */

const raw: Dashboard = {
  groups: [
    {
      id: "grp_cs",
      name: "Computer Science · Year 2",
      exams: [
        {
          id: "exm_001",
          title: "Algorithms — Midterm",
          createdAt: "2026-07-02T09:00:00.000Z",
          examKey: "ALGO-7F3K",
          status: "published",
          access: "scheduled",
          security: "high",
          questionCount: 32,
          enteredStudents: 0,
          totalStudents: 118,
        },
        {
          id: "exm_002",
          title: "Data Structures — Quiz 4",
          createdAt: "2026-07-14T13:30:00.000Z",
          examKey: "DSQ4-9M2P",
          status: "draft",
          access: "closed",
          security: "medium",
          questionCount: 12,
          enteredStudents: 0,
          totalStudents: 118,
        },
        {
          id: "exm_003",
          title: "Operating Systems — Final",
          createdAt: "2026-06-20T08:00:00.000Z",
          examKey: "OSFN-4C19",
          status: "archived",
          access: "closed",
          security: "high",
          questionCount: 45,
          enteredStudents: 116,
          totalStudents: 118,
        },
      ],
    },
    {
      id: "grp_math",
      name: "Mathematics · Year 1",
      exams: [
        {
          id: "exm_101",
          title: "Calculus I — Weekly Test 3",
          createdAt: "2026-07-18T10:15:00.000Z",
          examKey: "CALC-2A8Q",
          status: "published",
          access: "open",
          security: "low",
          questionCount: 8,
          enteredStudents: 41,
          totalStudents: 204,
        },
        {
          id: "exm_102",
          title: "Linear Algebra — Midterm",
          createdAt: "2026-07-21T11:00:00.000Z",
          examKey: "LINA-6H4R",
          status: "draft",
          access: "closed",
          security: "medium",
          questionCount: 20,
          enteredStudents: 0,
          totalStudents: 204,
        },
      ],
    },
    {
      id: "grp_phys",
      name: "Physics · Year 3",
      exams: [],
    },
  ],
};

export const mockDashboard = dashboardSchema.parse(raw);
