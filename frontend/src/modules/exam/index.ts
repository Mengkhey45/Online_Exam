/**
 * Public surface of the exam module. Other modules and route files import from
 * here only — never reach into ./components/* directly (AGENTS §5).
 */

// Domain types & schemas (the §6 data contract)
export * from "./types";

// Dashboard listing (provisional shapes — see summary.ts)
export type { ExamSummary, ExamGroup, Dashboard } from "./summary";

// Queries
export { useDashboard, examKeys } from "./queries";

// Screens & shared exam UI
export { DashboardView } from "./components/dashboard-view";
export {
  StatusBadge,
  AccessBadge,
  SecurityBadge,
} from "./components/exam-badges";
