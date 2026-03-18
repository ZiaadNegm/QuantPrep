"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { StatBlock } from "@/components/stat-block";
import { cn, formatResponseTime } from "@/lib/utils";
import { QuestionResult } from "@/lib/types";
import { RotateCcw, ArrowRight, Home, FileText } from "lucide-react";

interface SessionResultData {
  mode: "practice" | "test";
  difficulty?: string;
  preset?: string;
  results: QuestionResult[];
  score: number;
  accuracy: number;
  totalTime: number;
  avgResponseTime: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  questionCount: number;
}

export default function ResultsPage() {
  const router = useRouter();
  const [sessionData, setSessionData] = useState<SessionResultData | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("lastSessionResult");
    if (stored) {
      setSessionData(JSON.parse(stored));
    }
  }, []);

  if (!sessionData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="mb-4 text-foreground-muted">No session data found</p>
          <Link
            href="/mental-math"
            className="text-sm text-foreground-muted underline hover:text-foreground"
          >
            Start a new session
          </Link>
        </div>
      </div>
    );
  }

  const isPractice = sessionData.mode === "practice";
  const mistakes = sessionData.results.filter((r) => !r.isCorrect);

  // Calculate breakdowns
  const byOperation: Record<string, { correct: number; total: number }> = {};
  const byNumberType: Record<string, { correct: number; total: number }> = {};

  sessionData.results.forEach((r) => {
    const op = r.question.operation;
    const nt = r.question.numberType;

    if (!byOperation[op]) byOperation[op] = { correct: 0, total: 0 };
    byOperation[op].total++;
    if (r.isCorrect) byOperation[op].correct++;

    if (!byNumberType[nt]) byNumberType[nt] = { correct: 0, total: 0 };
    byNumberType[nt].total++;
    if (r.isCorrect) byNumberType[nt].correct++;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header isLoggedIn={true} />

      <main className="mx-auto max-w-3xl px-6 pb-16 pt-20">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-foreground-muted">
          <Link href="/" className="transition-colors hover:text-foreground">
            Dashboard
          </Link>
          <span>/</span>
          <Link
            href="/mental-math"
            className="transition-colors hover:text-foreground"
          >
            Mental Math
          </Link>
          <span>/</span>
          <span className="text-foreground">Results</span>
        </nav>

        {/* Main Summary */}
        <section className="mb-10 rounded-lg border border-border bg-background-elevated p-8">
          <div className="mb-8 text-center">
            <div className="mb-2 font-mono text-6xl font-bold text-foreground-bright">
              {sessionData.score}
            </div>
            <p className="text-sm text-foreground-muted">
              {isPractice ? "Points" : "Score"} /{" "}
              {sessionData.accuracy}% accuracy
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 border-t border-border-subtle pt-6 sm:grid-cols-6">
            <StatBlock
              label="Total Time"
              value={`${Math.floor(sessionData.totalTime / 1000)}s`}
            />
            <StatBlock
              label="Avg. Time"
              value={formatResponseTime(sessionData.avgResponseTime)}
            />
            <StatBlock
              label="Questions"
              value={sessionData.questionCount}
            />
            <StatBlock
              label="Correct"
              value={sessionData.correctCount}
              className="text-success"
            />
            <StatBlock
              label="Wrong"
              value={sessionData.wrongCount}
              className="text-error"
            />
            <StatBlock
              label="Skipped"
              value={sessionData.skippedCount}
            />
          </div>
        </section>

        {/* Session Metadata */}
        <section className="mb-10 rounded-lg border border-border-subtle bg-background-elevated p-6">
          <h2 className="mb-4 text-xs uppercase tracking-wider text-foreground-muted">
            Session Details
          </h2>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex gap-2">
              <span className="text-foreground-muted">Mode:</span>
              <span className="text-foreground">
                {isPractice ? "Practice" : sessionData.preset || "Test"}
              </span>
            </div>
            {sessionData.difficulty && (
              <div className="flex gap-2">
                <span className="text-foreground-muted">Level:</span>
                <span className="font-mono text-foreground">
                  {sessionData.difficulty}
                </span>
              </div>
            )}
          </div>
          <p className="mt-4 text-xs text-foreground-muted">
            Scoring:{" "}
            {isPractice
              ? "+1 correct, 0 wrong/skipped"
              : "+1 correct, -1 wrong, 0 skipped"}
          </p>
        </section>

        {/* Breakdowns */}
        <section className="mb-10 grid gap-6 sm:grid-cols-2">
          {/* By Operation */}
          <div className="rounded-lg border border-border-subtle bg-background-elevated p-6">
            <h3 className="mb-4 text-xs uppercase tracking-wider text-foreground-muted">
              By Operation
            </h3>
            <div className="space-y-3">
              {Object.entries(byOperation).map(([op, data]) => (
                <div key={op} className="flex items-center justify-between">
                  <span className="text-sm capitalize text-foreground">{op}</span>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full bg-foreground-muted"
                        style={{
                          width: `${(data.correct / data.total) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="w-16 text-right font-mono text-xs text-foreground-muted">
                      {data.correct}/{data.total}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By Number Type */}
          <div className="rounded-lg border border-border-subtle bg-background-elevated p-6">
            <h3 className="mb-4 text-xs uppercase tracking-wider text-foreground-muted">
              By Number Type
            </h3>
            <div className="space-y-3">
              {Object.entries(byNumberType).map(([nt, data]) => (
                <div key={nt} className="flex items-center justify-between">
                  <span className="text-sm capitalize text-foreground">{nt}</span>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full bg-foreground-muted"
                        style={{
                          width: `${(data.correct / data.total) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="w-16 text-right font-mono text-xs text-foreground-muted">
                      {data.correct}/{data.total}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mistakes Preview */}
        {mistakes.length > 0 && (
          <section className="mb-10 rounded-lg border border-border-subtle bg-background-elevated p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wider text-foreground-muted">
                Mistakes Preview
              </h3>
              <Link
                href="/mistakes"
                className="text-xs text-foreground-muted transition-colors hover:text-foreground"
              >
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {mistakes.slice(0, 5).map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-md border border-border bg-background-card p-3"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm text-foreground">
                      {result.question.prompt}
                    </span>
                    <span className="text-foreground-muted">=</span>
                    <span
                      className={cn(
                        "font-mono text-sm",
                        result.isSkipped
                          ? "text-foreground-muted italic"
                          : "text-error line-through"
                      )}
                    >
                      {result.isSkipped ? "skipped" : result.userAnswer}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm text-success">
                      {result.question.answer}
                    </span>
                    <span className="font-mono text-xs text-foreground-muted">
                      {formatResponseTime(result.responseTime)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Actions */}
        <section className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              // Get the stored session config and restart
              router.back();
            }}
            className="flex items-center gap-2 rounded-lg border border-border bg-background-card px-5 py-2.5 text-sm text-foreground transition-all hover:bg-background-hover"
          >
            <RotateCcw className="h-4 w-4" />
            Retry Session
          </button>
          <Link
            href="/mental-math"
            className="flex items-center gap-2 rounded-lg border border-border bg-background-card px-5 py-2.5 text-sm text-foreground transition-all hover:bg-background-hover"
          >
            <ArrowRight className="h-4 w-4" />
            New Practice
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg border border-border bg-background-card px-5 py-2.5 text-sm text-foreground transition-all hover:bg-background-hover"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/mistakes"
            className="flex items-center gap-2 rounded-lg border border-border bg-background-card px-5 py-2.5 text-sm text-foreground transition-all hover:bg-background-hover"
          >
            <FileText className="h-4 w-4" />
            View Mistakes
          </Link>
        </section>
      </main>
    </div>
  );
}
