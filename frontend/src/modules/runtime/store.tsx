"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import type { Answer } from "@/modules/exam";
import { loadAnswers, markSynced, putAnswer } from "./db";
import { syncAnswers, type Sitting } from "./queries";
import { buildPresentedItems, type PresentedItem } from "./select";
import type { AnswerMap, SaveState } from "./types";

type State = { currentIndex: number; answers: AnswerMap };

type Action =
  | { kind: "hydrate"; answers: AnswerMap }
  | { kind: "set_answer"; answer: Answer }
  | { kind: "goto"; index: number };

function reducer(state: State, action: Action): State {
  switch (action.kind) {
    case "hydrate":
      return { ...state, answers: { ...action.answers, ...state.answers } };
    case "set_answer":
      return {
        ...state,
        answers: { ...state.answers, [action.answer.questionId]: action.answer },
      };
    case "goto":
      return { ...state, currentIndex: action.index };
    default:
      return state;
  }
}

type RuntimeValue = {
  sitting: Sitting;
  items: PresentedItem[];
  current: PresentedItem;
  currentIndex: number;
  answers: AnswerMap;
  saveState: SaveState;
  goTo: (index: number) => void;
  next: () => void;
  prev: () => void;
  /** Update the answer payload for a question (merges, stamps updatedAt). */
  updateAnswer: (questionId: string, patch: Partial<Answer>) => void;
  toggleFlag: (questionId: string) => void;
};

const RuntimeContext = createContext<RuntimeValue | null>(null);

const SYNC_INTERVAL_MS = 4000;
const MAX_BACKOFF_MS = 30_000;

export function RuntimeProvider({
  attemptId,
  sitting,
  children,
}: {
  attemptId: string;
  sitting: Sitting;
  children: React.ReactNode;
}) {
  const items = useMemo(() => buildPresentedItems(sitting), [sitting]);
  const [state, dispatch] = useReducer(reducer, { currentIndex: 0, answers: {} });

  // Sync bookkeeping — refs so the interval always sees the latest without
  // re-subscribing. `dirty` holds questionIds with unsynced local edits.
  const dirty = useRef<Set<string>>(new Set());
  const answersRef = useRef<AnswerMap>(state.answers);
  const failCount = useRef(0);
  const nextRetryAt = useRef(0);
  const flushing = useRef(false);

  const [online, setOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [pending, setPending] = useState(0);

  // Keep the latest answers reachable from the sync loop without re-subscribing.
  useEffect(() => {
    answersRef.current = state.answers;
  }, [state.answers]);

  // Restore any answers stored locally on this device (reload / offline).
  useEffect(() => {
    let alive = true;
    loadAnswers(attemptId).then((rows) => {
      if (!alive || rows.length === 0) return;
      const map: AnswerMap = {};
      for (const r of rows) {
        map[r.questionId] = r.answer;
        if (!r.synced) dirty.current.add(r.questionId);
      }
      dispatch({ kind: "hydrate", answers: map });
      setPending(dirty.current.size);
    });
    return () => {
      alive = false;
    };
  }, [attemptId]);

  // Online/offline awareness (never blocks the UI — AGENTS §3.2).
  useEffect(() => {
    const up = () => {
      setOnline(true);
      nextRetryAt.current = 0; // retry immediately on reconnect
    };
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  const flush = useCallback(async () => {
    if (flushing.current) return;
    if (dirty.current.size === 0) return;
    if (Date.now() < nextRetryAt.current) return;

    flushing.current = true;
    const ids = [...dirty.current];
    const batch = ids
      .map((id) => answersRef.current[id])
      .filter((a): a is Answer => Boolean(a));
    try {
      const accepted = await syncAnswers(attemptId, batch);
      await markSynced(attemptId, accepted);
      for (const id of accepted) dirty.current.delete(id);
      failCount.current = 0;
      nextRetryAt.current = 0;
      setOnline(true);
      setPending(dirty.current.size);
    } catch {
      // Retry with exponential backoff. Answers stay safe in IndexedDB.
      failCount.current += 1;
      nextRetryAt.current =
        Date.now() +
        Math.min(MAX_BACKOFF_MS, 1000 * 2 ** failCount.current);
      setOnline(false);
    } finally {
      flushing.current = false;
    }
  }, [attemptId]);

  // Periodic sync. Independent of rendering; a keystroke never awaits it.
  useEffect(() => {
    const t = setInterval(() => {
      if (navigator.onLine) void flush();
    }, SYNC_INTERVAL_MS);
    return () => clearInterval(t);
  }, [flush]);

  const record = useCallback(
    (answer: Answer) => {
      dispatch({ kind: "set_answer", answer });
      dirty.current.add(answer.questionId);
      setPending(dirty.current.size);
      // Immediate, synchronous-with-interaction local write (rule 3.2).
      void putAnswer(attemptId, answer);
    },
    [attemptId],
  );

  const updateAnswer = useCallback(
    (questionId: string, patch: Partial<Answer>) => {
      const prev = answersRef.current[questionId];
      const next: Answer = {
        ...prev,
        ...patch,
        questionId,
        flaggedForReview:
          patch.flaggedForReview ?? prev?.flaggedForReview ?? false,
        updatedAt: new Date().toISOString(),
      };
      record(next);
    },
    [record],
  );

  const toggleFlag = useCallback(
    (questionId: string) => {
      const prev = answersRef.current[questionId];
      updateAnswer(questionId, {
        flaggedForReview: !(prev?.flaggedForReview ?? false),
      });
    },
    [updateAnswer],
  );

  const goTo = useCallback(
    (index: number) =>
      dispatch({
        kind: "goto",
        index: Math.max(0, Math.min(index, items.length - 1)),
      }),
    [items.length],
  );
  const next = useCallback(
    () => goTo(state.currentIndex + 1),
    [goTo, state.currentIndex],
  );
  const prev = useCallback(
    () => goTo(state.currentIndex - 1),
    [goTo, state.currentIndex],
  );

  const saveState: SaveState = !online
    ? "offline"
    : pending > 0
      ? "saving"
      : "saved";

  const value: RuntimeValue = {
    sitting,
    items,
    current: items[state.currentIndex],
    currentIndex: state.currentIndex,
    answers: state.answers,
    saveState,
    goTo,
    next,
    prev,
    updateAnswer,
    toggleFlag,
  };

  return (
    <RuntimeContext.Provider value={value}>{children}</RuntimeContext.Provider>
  );
}

export function useRuntime() {
  const ctx = useContext(RuntimeContext);
  if (!ctx) throw new Error("useRuntime must be used within a RuntimeProvider");
  return ctx;
}
