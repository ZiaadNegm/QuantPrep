"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { StatBlock } from "@/components/stat-block";

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
  totalQuestions: number;
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
          totalQuestions: session.question_count_target ?? questions.length,
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
        <p className="text-foreground-muted">Loading results...</p>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-error">{error ?? "No results found"}</p>
        <button
          onClick={() => router.push("/mental-math")}
          className="text-sm text-foreground-muted transition-colors hover:text-foreground"
        >
          Back to Mental Math
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-3xl space-y-6">
        {/* Score section */}
        <div className="rounded-lg border border-border bg-background-elevated p-8">
          <div className="mb-6 text-center">
            <p className="font-mono text-6xl font-bold text-foreground-bright">
              {results.score}
            </p>
            <p className="mt-1 text-sm text-foreground-muted">
              Score &middot; {results.accuracy.toFixed(1)}% accuracy
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 border-t border-border-subtle pt-6 sm:grid-cols-6">
            <StatBlock
              label="Total Time"
              value={formatTime(results.totalTimeSeconds)}
            />
            <StatBlock
              label="Avg. Time"
              value={`${results.averageResponseTimeSeconds.toFixed(1)}s`}
            />
            <StatBlock
              label="Questions"
              value={results.totalQuestions}
            />
            <StatBlock
              label="Correct"
              value={results.correct}
              className="[&>span:nth-child(2)]:text-success"
            />
            <StatBlock
              label="Wrong"
              value={results.wrong}
              className="[&>span:nth-child(2)]:text-error"
            />
            <StatBlock
              label="Skipped"
              value={results.skipped}
            />
          </div>
        </div>

        {/* Session details */}
        <div className="rounded-lg border border-border-subtle bg-background-elevated p-6">
          <h2 className="mb-3 text-xs uppercase tracking-wider text-foreground-muted">
            Session Details
          </h2>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-foreground-muted">Mode: </span>
              <span className="text-foreground">
                {results.mode === "test" ? "Test" : "Practice"}
                {results.presetName && ` (${results.presetName})`}
              </span>
            </p>
            {results.levels.length > 0 && (
              <p>
                <span className="text-foreground-muted">Levels: </span>
                <span className="text-foreground">
                  {results.levels.map((l) => `L${l}`).join(", ")}
                </span>
              </p>
            )}
            <p>
              <span className="text-foreground-muted">Timer: </span>
              <span className="text-foreground">
                {results.timerEnabled ? "Timed" : "Untimed"}
              </span>
            </p>
          </div>
          <p className="mt-3 text-xs text-foreground-muted">
            {results.mode === "practice"
              ? "Scoring: +1 correct, 0 wrong, 0 skipped"
              : "Scoring: +1 correct, -1 wrong, 0 skipped"}
          </p>
        </div>

        {/* Mistakes */}
        {results.mistakes.length > 0 && (
          <div className="rounded-lg border border-border-subtle bg-background-elevated p-6">
            <h2 className="mb-4 text-xs uppercase tracking-wider text-foreground-muted">
              Mistakes ({results.mistakes.length})
            </h2>
            <div className="space-y-2">
              {results.mistakes.map((m, i) => (
                <div
                  key={i}
                  className="rounded-md border border-border bg-background-card p-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-sm text-foreground-bright">
                        {m.prompt}
                      </p>
                      {m.skipped ? (
                        <p className="mt-1 text-sm text-foreground-muted italic">
                          Skipped
                        </p>
                      ) : (
                        <p className="mt-1 text-sm">
                          <span className="text-error line-through">
                            {m.userAnswer}
                          </span>
                          <span className="mx-2 text-foreground-muted">&rarr;</span>
                          <span className="text-success">
                            {m.correctAnswer}
                          </span>
                        </p>
                      )}
                    </div>
                    {m.responseTimeSeconds !== null && (
                      <span className="font-mono text-xs text-foreground-muted">
                        {m.responseTimeSeconds.toFixed(1)}s
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-4">
          <Link
            href="/dashboard"
            className="rounded-lg border border-border bg-background-card px-5 py-2.5 text-sm text-foreground transition-all hover:bg-background-hover"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/mental-math"
            className="rounded-lg border border-border bg-background-card px-5 py-2.5 text-sm text-foreground transition-all hover:bg-background-hover"
          >
            Start New Session
          </Link>
        </div>
      </div>
    </div>
  );
}
