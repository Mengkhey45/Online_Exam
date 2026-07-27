"use client";

import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
} from "react";
import type { Grading } from "./schema";

type State = { grading: Grading };

type Action =
  | {
      kind: "set_mark";
      questionId: string;
      attemptId: string;
      awarded: number | null;
    }
  | {
      kind: "set_comment";
      questionId: string;
      attemptId: string;
      comment: string;
    };

function patchResponse(
  grading: Grading,
  questionId: string,
  attemptId: string,
  patch: Partial<{ awarded: number | null; comment: string }>,
): Grading {
  return {
    ...grading,
    questions: grading.questions.map((q) =>
      q.id !== questionId
        ? q
        : {
            ...q,
            responses: q.responses.map((r) =>
              r.attemptId === attemptId ? { ...r, ...patch } : r,
            ),
          },
    ),
  };
}

function reducer(state: State, action: Action): State {
  switch (action.kind) {
    case "set_mark":
      return {
        grading: patchResponse(state.grading, action.questionId, action.attemptId, {
          awarded: action.awarded,
        }),
      };
    case "set_comment":
      return {
        grading: patchResponse(state.grading, action.questionId, action.attemptId, {
          comment: action.comment,
        }),
      };
    default:
      return state;
  }
}

type GradingContextValue = {
  grading: Grading;
  dispatch: Dispatch<Action>;
  /** Every response has an awarded mark (auto-scored count as graded). */
  fullyGraded: boolean;
  graded: number;
  totalResponses: number;
};

const GradingContext = createContext<GradingContextValue | null>(null);

export function GradingProvider({
  initial,
  children,
}: {
  initial: Grading;
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, { grading: initial });

  const value = useMemo<GradingContextValue>(() => {
    let total = 0;
    let graded = 0;
    for (const q of state.grading.questions) {
      for (const r of q.responses) {
        total += 1;
        if (r.awarded !== null) graded += 1;
      }
    }
    return {
      grading: state.grading,
      dispatch,
      graded,
      totalResponses: total,
      fullyGraded: total > 0 && graded === total,
    };
  }, [state.grading]);

  return (
    <GradingContext.Provider value={value}>{children}</GradingContext.Provider>
  );
}

export function useGradingStore() {
  const ctx = useContext(GradingContext);
  if (!ctx)
    throw new Error("useGradingStore must be used within a GradingProvider");
  return ctx;
}
