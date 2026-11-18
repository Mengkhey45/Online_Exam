import Dexie, { type Table } from "dexie";
import type { Answer } from "@/modules/exam";

/**
 * Local answer store (AGENTS §3.2). Every answer change is written here
 * immediately, synchronously with the interaction, before any network call.
 * A student who goes offline keeps working; on reload we restore from here.
 *
 * Answers are keyed by attempt + question ID — never by position (rule 3.1).
 */
export interface StoredAnswer {
  key: string; // `${attemptId}::${questionId}`
  attemptId: string;
  questionId: string;
  answer: Answer;
  synced: boolean; // false until the server confirms it
  updatedAt: string; // ISO — used to resolve local-vs-server freshness
}

class ExamroomDB extends Dexie {
  answers!: Table<StoredAnswer, string>;

  constructor() {
    super("examroom");
    this.version(1).stores({
      // Indexes: primary key `key`, plus lookups by attempt and sync state.
      answers: "key, attemptId, synced",
    });
  }
}

// Dexie opens lazily on first operation, so constructing this is safe even
// where IndexedDB is unavailable; operations only run in the client runtime.
export const db = new ExamroomDB();

export function answerKey(attemptId: string, questionId: string): string {
  return `${attemptId}::${questionId}`;
}

/** Write one answer immediately. Returns the promise but callers fire-and-go. */
export function putAnswer(attemptId: string, answer: Answer): Promise<string> {
  return db.answers.put({
    key: answerKey(attemptId, answer.questionId),
    attemptId,
    questionId: answer.questionId,
    answer,
    synced: false,
    updatedAt: answer.updatedAt,
  });
}

/** All locally stored answers for an attempt — used to restore on reload. */
export function loadAnswers(attemptId: string): Promise<StoredAnswer[]> {
  return db.answers.where("attemptId").equals(attemptId).toArray();
}

/** Answers not yet confirmed by the server — the sync queue drains these. */
export function loadUnsynced(attemptId: string): Promise<StoredAnswer[]> {
  return db.answers
    .where("attemptId")
    .equals(attemptId)
    .and((r) => !r.synced)
    .toArray();
}

/**
 * Mark answers as confirmed by the server — but only the exact versions that
 * were sent. If the student edited a question while the sync was in flight,
 * the stored copy is newer and must stay unsynced so it goes out next time.
 */
export async function markSynced(
  attemptId: string,
  sent: { questionId: string; updatedAt: string }[],
): Promise<void> {
  await db.transaction("rw", db.answers, async () => {
    for (const { questionId, updatedAt } of sent) {
      await db.answers
        .where("key")
        .equals(answerKey(attemptId, questionId))
        .and((r) => r.updatedAt === updatedAt)
        .modify({ synced: true });
    }
  });
}
