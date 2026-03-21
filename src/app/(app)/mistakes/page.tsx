"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface Mistake {
  prompt: string;
  userAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  skipped: boolean;
  responseTimeMs: number | null;
  answeredAt: string | null;
  level: number;
  operationType: string;
  numberType: string;
  variablePosition: string | null;
  targetTimeSeconds: number | null;
  sessionMode: string | null;
  sessionId: string;
}

type FilterType = "all" | "incorrect" | "skipped";

export default function MistakesPage() {
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [level, setLevel] = useState("");
  const [operation, setOperation] = useState("");
  const [numberType, setNumberType] = useState("");
  const [mode, setMode] = useState("");

  const fetchMistakes = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("filter", filter);
    if (level) params.set("level", level);
    if (operation) params.set("operation", operation);
    if (numberType) params.set("numberType", numberType);
    if (mode) params.set("mode", mode);
    params.set("limit", "50");
    params.set("offset", "0");

    fetch(`/api/mistakes?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setMistakes(data.mistakes ?? []);
          setTotal(data.total ?? 0);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter, level, operation, numberType, mode]);

  useEffect(() => {
    fetchMistakes();
  }, [fetchMistakes]);

  return (
    <div className="px-6 py-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <h1 className="text-lg font-medium text-foreground-bright">Mistakes</h1>

        {/* Tab bar */}
        <div className="flex items-center gap-4 border-b border-border-subtle">
          {(
            [
              { key: "all", label: "All" },
              { key: "incorrect", label: "Incorrect" },
              { key: "skipped", label: "Skipped" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "border-b-2 pb-3 text-sm capitalize transition-colors",
                filter === key
                  ? "border-foreground-muted text-foreground-bright"
                  : "border-transparent text-foreground-muted hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-3">
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="rounded-md border border-border bg-background-elevated px-3 py-1.5 text-sm text-foreground outline-none focus:border-foreground-muted"
          >
            <option value="">Any Level</option>
            {[1, 2, 3, 4, 5].map((l) => (
              <option key={l} value={l}>
                Level {l}
              </option>
            ))}
          </select>

          <select
            value={operation}
            onChange={(e) => setOperation(e.target.value)}
            className="rounded-md border border-border bg-background-elevated px-3 py-1.5 text-sm text-foreground outline-none focus:border-foreground-muted"
          >
            <option value="">Any Operation</option>
            {["add", "sub", "mul", "div"].map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>

          <select
            value={numberType}
            onChange={(e) => setNumberType(e.target.value)}
            className="rounded-md border border-border bg-background-elevated px-3 py-1.5 text-sm text-foreground outline-none focus:border-foreground-muted"
          >
            <option value="">Any Number Type</option>
            {["integer", "decimal", "fraction"].map((nt) => (
              <option key={nt} value={nt}>
                {nt}
              </option>
            ))}
          </select>

          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="rounded-md border border-border bg-background-elevated px-3 py-1.5 text-sm text-foreground outline-none focus:border-foreground-muted"
          >
            <option value="">Any Mode</option>
            <option value="practice">Practice</option>
            <option value="test">Test</option>
          </select>
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-sm text-foreground-muted">
            {total} mistake{total !== 1 ? "s" : ""} found
          </p>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-lg border border-border-subtle bg-background-elevated p-4">
                <div className="h-5 w-48 rounded bg-background-card" />
                <div className="mt-2 h-4 w-32 rounded bg-background-card" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && mistakes.length === 0 && (
          <div className="rounded-lg border border-border-subtle bg-background-elevated p-10 text-center">
            <p className="text-lg font-medium text-foreground-muted">
              No mistakes yet — keep practicing!
            </p>
            <p className="mt-1 text-sm text-foreground-muted">
              Mistakes from your sessions will appear here for review.
            </p>
            <Link
              href="/mental-math"
              className="mt-4 inline-block rounded-lg border border-foreground-muted bg-background-card px-6 py-2.5 text-sm font-medium text-foreground-bright transition-all hover:bg-background-hover"
            >
              Start a session
            </Link>
          </div>
        )}

        {/* Mistakes list */}
        {!loading && mistakes.length > 0 && (
          <div className="space-y-3">
            {mistakes.map((m, i) => (
              <div key={i} className="rounded-lg border border-border-subtle bg-background-elevated p-4">
                <div className="flex items-start justify-between">
                  <p className="font-mono text-lg text-foreground-bright">{m.prompt}</p>
                  <div className="flex items-center gap-2">
                    {m.sessionMode && (
                      <span className="rounded bg-background-card px-2 py-0.5 font-mono text-xs text-foreground-muted">
                        {m.sessionMode}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-6 text-sm">
                  {m.skipped ? (
                    <span className="font-mono text-foreground-muted italic">skipped</span>
                  ) : (
                    <>
                      <span className="text-foreground-muted">
                        Your answer:{" "}
                        <span className="font-mono text-error line-through">
                          {m.userAnswer ?? "—"}
                        </span>
                      </span>
                      <span className="text-foreground-muted">
                        Correct:{" "}
                        <span className="font-mono text-success">
                          {m.correctAnswer}
                        </span>
                      </span>
                    </>
                  )}
                  {m.responseTimeMs != null && (
                    <span className="text-xs text-foreground-muted">
                      {(m.responseTimeMs / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded bg-background-card px-2 py-0.5 font-mono text-xs text-foreground-muted">
                    L{m.level}
                  </span>
                  <span className="rounded bg-background-card px-2 py-0.5 font-mono text-xs text-foreground-muted">
                    {m.operationType}
                  </span>
                  <span className="rounded bg-background-card px-2 py-0.5 font-mono text-xs text-foreground-muted">
                    {m.numberType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
