"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface MistakeItem {
  prompt: string;
  userAnswer: string | null;
  correctAnswer: string;
  responseTimeSeconds: number | null;
  skipped: boolean;
}

interface SessionResults {
  mode: "practice" | "test";
  presetName: string | null;
  score: number;
  correct: number;
  wrong: number;
  skipped: number;
  accuracy: number;
  totalTimeSeconds: number;
  averageResponseTimeSeconds: number;
  withinTargetTimePercent: number;
  levels: number[];
  timerEnabled: boolean;
  mistakes: MistakeItem[];
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [results, setResults] = useState<SessionResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (!res.ok) throw new Error("Failed to load results");
        const data = await res.json();
        const session = data.session;
        const questions = data.questions ?? [];

        if (session.status !== "completed") {
          router.replace(`/mental-math/session/${sessionId}`);
          return;
        }

        // Compute total time
        const startedAt = new Date(session.started_at).getTime();
        const endedAt = session.ended_at
          ? new Date(session.ended_at).getTime()
          : Date.now();
        const totalTimeSeconds = (endedAt - startedAt) / 1000;

        // Build mistakes list
        const mistakes: MistakeItem[] = questions
          .filter(
            (q: Record<string, unknown>) =>
              q.is_correct === false || q.skipped === true
          )
          .map((q: Record<string, unknown>) => ({
            prompt: q.prompt as string,
            userAnswer: (q.user_answer as string) ?? null,
            correctAnswer: q.correct_answer as string,
            responseTimeSeconds: q.response_time_ms
              ? (q.response_time_ms as number) / 1000
              : null,
            skipped: q.skipped as boolean,
          }));

        setResults({
          mode: session.mode,
          presetName: session.preset_name,
          score: session.score ?? 0,
          correct: session.correct_count ?? 0,
          wrong: session.wrong_count ?? 0,
          skipped: session.skipped_count ?? 0,
          accuracy: (session.accuracy ?? 0) * 100,
          totalTimeSeconds,
          averageResponseTimeSeconds: session.avg_response_time_ms
            ? session.avg_response_time_ms / 1000
            : 0,
          withinTargetTimePercent: (session.percent_within_target ?? 0) * 100,
          levels: session.selected_levels ?? [],
          timerEnabled: session.timer_enabled ?? false,
          mistakes,
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load results");
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, [sessionId, router]);

  function formatTime(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}m ${s}s`;
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-gray-500">Loading results...</p>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-red-600">{error ?? "No results found"}</p>
        <button
          onClick={() => router.push("/mental-math")}
          className="text-sm text-blue-600 hover:underline"
        >
          Back to Mental Math
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Session Results</h1>

      {/* Score */}
      <div className="mb-8 rounded-lg border p-6 text-center">
        <p className="text-5xl font-bold">{results.score}</p>
        <p className="mt-1 text-sm text-gray-500">
          Score ({results.accuracy.toFixed(1)}% accuracy)
        </p>
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Correct" value={String(results.correct)} />
        <Stat label="Wrong" value={String(results.wrong)} />
        <Stat label="Skipped" value={String(results.skipped)} />
        <Stat label="Total Time" value={formatTime(results.totalTimeSeconds)} />
        <Stat
          label="Avg Response"
          value={`${results.averageResponseTimeSeconds.toFixed(1)}s`}
        />
        <Stat
          label="Within Target"
          value={`${results.withinTargetTimePercent.toFixed(0)}%`}
        />
      </div>

      {/* Metadata */}
      <div className="mb-8 rounded border bg-gray-50 p-4 text-sm text-gray-600">
        <p>
          <span className="font-medium">Mode:</span>{" "}
          {results.mode === "test" ? "Test" : "Practice"}
          {results.presetName && ` (${results.presetName})`}
        </p>
        {results.levels.length > 0 && (
          <p>
            <span className="font-medium">Levels:</span>{" "}
            {results.levels.map((l) => `L${l}`).join(", ")}
          </p>
        )}
        <p>
          <span className="font-medium">Timer:</span>{" "}
          {results.timerEnabled ? "Timed" : "Untimed"}
        </p>
        <p className="mt-2 text-xs text-gray-400">
          {results.mode === "practice"
            ? "Scoring: +1 correct, 0 wrong, 0 skipped"
            : "Scoring: +1 correct, -1 wrong, 0 skipped"}
        </p>
      </div>

      {/* Mistakes */}
      {results.mistakes.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Mistakes</h2>
          <div className="space-y-2">
            {results.mistakes.map((m, i) => (
              <div key={i} className="rounded border p-3 text-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{m.prompt}</p>
                    {m.skipped ? (
                      <p className="text-gray-500">Skipped</p>
                    ) : (
                      <p>
                        <span className="text-red-600">
                          Your answer: {m.userAnswer}
                        </span>
                        <span className="mx-2 text-gray-300">|</span>
                        <span className="text-green-600">
                          Correct: {m.correctAnswer}
                        </span>
                      </p>
                    )}
                  </div>
                  {m.responseTimeSeconds !== null && (
                    <span className="text-xs text-gray-400">
                      {m.responseTimeSeconds.toFixed(1)}s
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Link
          href="/dashboard"
          className="rounded border px-5 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          Back to Dashboard
        </Link>
        <Link
          href="/mental-math"
          className="rounded bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Start New Session
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border p-3 text-center">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
