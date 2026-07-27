/**
 * Public surface of the config module (AGENTS §5). Import from here only.
 * Config shapes are provisional — see schema.ts.
 */
export { ConfigView } from "./components/config-view";
export { useExamConfig, useSaveConfig } from "./queries";
export type { ExamConfig } from "./schema";
