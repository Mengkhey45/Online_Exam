import type { Answer } from "@/modules/exam";

/**
 * The save indicator shows exactly three states (AGENTS §3.2). Never more.
 *  saved   → all answers are on the server
 *  saving  → local changes are queued or in flight
 *  offline → working offline; answers are safe on this device
 */
export type SaveState = "saved" | "saving" | "offline";

/** A question cell's state in the answer-sheet rail (AGENTS §4 signature element). */
export type CellState = "current" | "answered" | "flagged" | "unanswered";

/** A local, unsynced answer edit. Identity is always by ID (rule 3.1). */
export type AnswerMap = Record<string, Answer>;
