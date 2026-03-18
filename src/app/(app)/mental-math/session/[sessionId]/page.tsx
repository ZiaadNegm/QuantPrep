"use client";

import { useEffect, useReducer, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

// --- Types ---

interface Question {
  prompt: string;
  orderIndex: number;
  targetTimeSeconds: number;
  answerLength: number;
  userAnswer?: string;
  responseTimeMs?: number;
  skipped?: boolean;
}

interface SessionState {
  status: "loading" | "active" | "paused" | "completed" | "error";
  sessionId: string;
  mode: "practice" | "test";
  questions: Question[];
  currentIndex: number;
  totalQuestions: number;
  timerEnabled: boolean;
  timerDurationSeconds: number | null;
  startedAt: string;
  remainingSeconds: number | null;
  inputValue: string;
  error: string | null;
}

type Action =
  | { type: "LOAD_SESSION"; payload: Partial<SessionState> & { questions: Question[] } }
  | { type: "SET_INPUT"; payload: string }
  | { type: "SUBMIT_ANSWER"; payload: { userAnswer: string; responseTimeMs: number } }
  | { type: "SKIP"; payload: { responseTimeMs: number } }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "TIMER_TICK" }
  | { type: "TIMER_EXPIRED" }
  | { type: "COMPLETE" }
  | { type: "ERROR"; payload: string };

const initialState: SessionState = {
  status: "loading",
  sessionId: "",
  mode: "practice",
  questions: [],
  currentIndex: 0,
  totalQuestions: 0,
  timerEnabled: false,
  timerDurationSeconds: null,
  startedAt: "",
  remainingSeconds: null,
  inputValue: "",
  error: null,
};

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case "LOAD_SESSION": {
      const p = action.payload;
      const remaining = p.remainingSeconds ?? p.timerDurationSeconds ?? null;
      return {
        ...state,
        status: "active",
        sessionId: p.sessionId ?? state.sessionId,
        mode: p.mode ?? state.mode,
        questions: p.questions,
        currentIndex: p.currentIndex ?? 0,
        totalQuestions: p.totalQuestions ?? p.questions.length,
        timerEnabled: p.timerEnabled ?? false,
        timerDurationSeconds: p.timerDurationSeconds ?? null,
        startedAt: p.startedAt ?? new Date().toISOString(),
        remainingSeconds: remaining !== null ? Math.round(remaining) : null,
        inputValue: "",
        error: null,
      };
    }
    case "SET_INPUT":
      return { ...state, inputValue: action.payload };
    case "SUBMIT_ANSWER": {
      const q = [...state.questions];
      if (q[state.currentIndex]) {
        q[state.currentIndex] = {
          ...q[state.currentIndex],
          userAnswer: action.payload.userAnswer,
          responseTimeMs: action.payload.responseTimeMs,
          skipped: false,
        };
      }
      const nextIndex = state.currentIndex + 1;
      if (nextIndex >= state.totalQuestions) {
        return { ...state, questions: q, currentIndex: nextIndex, status: "completed", inputValue: "" };
      }
      return { ...state, questions: q, currentIndex: nextIndex, inputValue: "" };
    }
    case "SKIP": {
      const q = [...state.questions];
      if (q[state.currentIndex]) {
        q[state.currentIndex] = {
          ...q[state.currentIndex],
          skipped: true,
          responseTimeMs: action.payload.responseTimeMs,
        };
      }
      const nextIndex = state.currentIndex + 1;
      if (nextIndex >= state.totalQuestions) {
        return { ...state, questions: q, currentIndex: nextIndex, status: "completed", inputValue: "" };
      }
      return { ...state, questions: q, currentIndex: nextIndex, inputValue: "" };
    }
    case "PAUSE":
      return { ...state, status: "paused" };
    case "RESUME":
      return { ...state, status: "active" };
    case "TIMER_TICK":
      if (state.remainingSeconds === null) return state;
      if (state.remainingSeconds <= 1) {
        return { ...state, remainingSeconds: 0, status: "completed" };
      }
      return { ...state, remainingSeconds: state.remainingSeconds - 1 };
    case "TIMER_EXPIRED":
      return { ...state, remainingSeconds: 0, status: "completed" };
    case "COMPLETE":
      return { ...state, status: "completed" };
    case "ERROR":
      return { ...state, status: "error", error: action.payload };
    default:
      return state;
  }
}

// --- localStorage helpers ---

const STORAGE_KEY_PREFIX = "quantprep_session_";

function saveToLocalStorage(sessionId: string, questions: Question[], currentIndex: number) {
  try {
    const data = {
      currentIndex,
      answers: questions.map((q) => ({
        orderIndex: q.orderIndex,
        userAnswer: q.userAnswer,
        responseTimeMs: q.responseTimeMs,
        skipped: q.skipped,
      })),
    };
    localStorage.setItem(STORAGE_KEY_PREFIX + sessionId, JSON.stringify(data));
  } catch {
    // localStorage may be unavailable
  }
}

function loadFromLocalStorage(sessionId: string): { currentIndex: number; answers: Array<{ orderIndex: number; userAnswer?: string; responseTimeMs?: number; skipped?: boolean }> } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + sessionId);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearLocalStorage(sessionId: string) {
  try {
    localStorage.removeItem(STORAGE_KEY_PREFIX + sessionId);
  } catch {
    // ignore
  }
}

// --- Component ---

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const [state, dispatch] = useReducer(reducer, initialState);
  const inputRef = useRef<HTMLInputElement>(null);
  const questionStartRef = useRef<number>(Date.now());
  const completingRef = useRef(false);

  // Load session
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (!res.ok) throw new Error("Failed to load session");
        const data = await res.json();
        const session = data.session;

        if (session.status === "completed") {
          clearLocalStorage(sessionId);
          router.replace(`/mental-math/results/${sessionId}`);
          return;
        }

        // Map DB snake_case questions to camelCase
        let mappedQuestions: Question[] = (data.questions ?? []).map((q: Record<string, unknown>) => ({
          prompt: q.prompt as string,
          orderIndex: q.order_index as number,
          targetTimeSeconds: q.target_time_seconds as number,
          answerLength: (q.answer_length as number) ?? 0,
          userAnswer: q.user_answer as string | undefined,
          responseTimeMs: q.response_time_ms as number | undefined,
          skipped: q.skipped as boolean | undefined,
        }));

        let currentIndex = session.current_question_index ?? 0;

        // Restore from localStorage if available (crash recovery)
        const saved = loadFromLocalStorage(sessionId);
        if (saved && saved.currentIndex > currentIndex) {
          currentIndex = saved.currentIndex;
          for (const ans of saved.answers) {
            const q = mappedQuestions.find((mq) => mq.orderIndex === ans.orderIndex);
            if (q && (ans.userAnswer || ans.skipped)) {
              q.userAnswer = ans.userAnswer;
              q.responseTimeMs = ans.responseTimeMs;
              q.skipped = ans.skipped;
            }
          }
        }

        dispatch({
          type: "LOAD_SESSION",
          payload: {
            sessionId,
            mode: session.mode,
            questions: mappedQuestions,
            currentIndex,
            totalQuestions: session.question_count_target ?? mappedQuestions.length,
            timerEnabled: session.timer_enabled ?? false,
            timerDurationSeconds: session.timer_duration_seconds ?? null,
            remainingSeconds: data.remainingSeconds ?? session.timer_duration_seconds ?? null,
            startedAt: session.started_at ?? new Date().toISOString(),
          },
        });
      } catch (err: unknown) {
        dispatch({
          type: "ERROR",
          payload: err instanceof Error ? err.message : "Failed to load session",
        });
      }
    }
    load();
  }, [sessionId, router]);

  // Timer
  useEffect(() => {
    if (state.status !== "active" || !state.timerEnabled || state.remainingSeconds === null) {
      return;
    }

    const interval = setInterval(() => {
      dispatch({ type: "TIMER_TICK" });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.status, state.timerEnabled, state.remainingSeconds]);

  // Handle session completion -> batch submit answers then redirect
  useEffect(() => {
    if (state.status !== "completed" || completingRef.current) return;
    completingRef.current = true;

    // Build answers array from state
    const answers = state.questions
      .filter((q) => q.userAnswer !== undefined || q.skipped)
      .map((q) => ({
        questionIndex: q.orderIndex,
        userAnswer: q.userAnswer ?? null,
        responseTimeMs: q.responseTimeMs ?? 0,
        skipped: q.skipped ?? false,
      }));

    fetch(`/api/sessions/${sessionId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    })
      .then(() => {
        clearLocalStorage(sessionId);
        router.push(`/mental-math/results/${sessionId}`);
      })
      .catch(() => {
        clearLocalStorage(sessionId);
        router.push(`/mental-math/results/${sessionId}`);
      });
  }, [state.status, state.questions, sessionId, router]);

  // Auto-focus input and reset question timer
  useEffect(() => {
    if (state.status === "active" && inputRef.current) {
      inputRef.current.focus();
      questionStartRef.current = Date.now();
    }
  }, [state.status, state.currentIndex]);

  // Save to localStorage after each answer/skip
  useEffect(() => {
    if (state.status === "active" && state.currentIndex > 0) {
      saveToLocalStorage(sessionId, state.questions, state.currentIndex);
    }
  }, [state.currentIndex, state.status, state.questions, sessionId]);

  // Auto-submit when input length matches expected answer length
  useEffect(() => {
    if (state.status !== "active") return;
    const currentQuestion = state.questions[state.currentIndex];
    if (!currentQuestion || currentQuestion.answerLength <= 0) return;
    const trimmed = state.inputValue.trim();
    if (trimmed.length > 0 && trimmed.length === currentQuestion.answerLength) {
      // Small delay so the user sees their last keystroke before advancing
      const timeout = setTimeout(() => {
        const responseTimeMs = Date.now() - questionStartRef.current;
        dispatch({
          type: "SUBMIT_ANSWER",
          payload: { userAnswer: trimmed, responseTimeMs },
        });
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [state.inputValue, state.status, state.currentIndex, state.questions]);

  const handleSubmit = useCallback(() => {
    if (state.status !== "active" || !state.inputValue.trim()) return;

    const responseTimeMs = Date.now() - questionStartRef.current;

    dispatch({
      type: "SUBMIT_ANSWER",
      payload: {
        userAnswer: state.inputValue.trim(),
        responseTimeMs,
      },
    });
  }, [state.inputValue, state.status]);

  const handleSkip = useCallback(() => {
    if (state.status !== "active") return;

    const responseTimeMs = Date.now() - questionStartRef.current;

    dispatch({
      type: "SKIP",
      payload: { responseTimeMs },
    });
  }, [state.status]);

  const handlePause = useCallback(async () => {
    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pause" }),
      });
      dispatch({ type: "PAUSE" });
    } catch {
      // silent
    }
  }, [sessionId]);

  const handleResume = useCallback(async () => {
    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resume" }),
      });
      dispatch({ type: "RESUME" });
    } catch {
      // silent
    }
  }, [sessionId]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }

  function formatTime(seconds: number): string {
    const totalSeconds = Math.floor(seconds);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  // --- Render ---

  if (state.status === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-gray-500">Loading session...</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-red-600">{state.error}</p>
        <button
          onClick={() => router.push("/mental-math")}
          className="text-sm text-blue-600 hover:underline"
        >
          Back to Mental Math
        </button>
      </div>
    );
  }

  if (state.status === "completed") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-gray-500">Saving results...</p>
      </div>
    );
  }

  const currentQuestion = state.questions[state.currentIndex];
  const isOpenEnded = state.totalQuestions === 0;
  const isPaused = state.status === "paused";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b pb-3">
        <span className="text-sm text-gray-600">
          {isOpenEnded
            ? `Question ${state.currentIndex + 1}`
            : `Question ${state.currentIndex + 1} of ${state.totalQuestions}`}
        </span>

        {state.timerEnabled && state.remainingSeconds !== null && (
          <span
            className={`text-sm font-mono ${
              state.remainingSeconds < 30 ? "text-red-600 font-bold" : "text-gray-600"
            }`}
          >
            {formatTime(state.remainingSeconds)}
          </span>
        )}
      </div>

      {/* Question area */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-12">
        {currentQuestion ? (
          <>
            <p className="text-4xl font-bold tracking-wide">
              {currentQuestion.prompt}
            </p>

            <div className="flex items-center gap-3">
              <input
                ref={inputRef}
                type="text"
                value={state.inputValue}
                onChange={(e) =>
                  dispatch({ type: "SET_INPUT", payload: e.target.value })
                }
                onKeyDown={handleKeyDown}
                disabled={isPaused}
                placeholder="Your answer"
                className="w-48 rounded border-2 border-gray-300 px-4 py-2 text-center text-lg focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
                autoComplete="off"
              />
              <button
                onClick={handleSubmit}
                disabled={isPaused || !state.inputValue.trim()}
                className="rounded bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Submit
              </button>
            </div>
          </>
        ) : (
          <p className="text-gray-500">No question available.</p>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between border-t pt-3">
        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            disabled={isPaused}
            className="rounded border px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Skip
          </button>

          <button
            onClick={() => dispatch({ type: "COMPLETE" })}
            className="rounded border border-red-300 px-4 py-1.5 text-sm text-red-600 hover:bg-red-50"
          >
            End Session
          </button>

          {state.mode === "practice" && (
            <>
              {isPaused ? (
                <button
                  onClick={handleResume}
                  className="rounded border border-green-300 px-4 py-1.5 text-sm text-green-700 hover:bg-green-50"
                >
                  Resume
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="rounded border px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Pause
                </button>
              )}
            </>
          )}
        </div>

        <p className="text-xs text-gray-400">
          {state.mode === "practice"
            ? "Scoring: +1 correct, 0 wrong/skipped"
            : "Scoring: +1 correct, -1 wrong, 0 skipped"}
        </p>
      </div>

      {/* Paused overlay */}
      {isPaused && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-white/80">
          <div className="text-center">
            <p className="mb-4 text-xl font-semibold">Session Paused</p>
            <button
              onClick={handleResume}
              className="rounded bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Resume
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
