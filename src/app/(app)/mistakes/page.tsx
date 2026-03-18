"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

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
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold">Mistakes</h1>

      {/* Tab bar */}
      <div className="flex gap-1 rounded border p-0.5 w-fit">
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
            className={`rounded px-4 py-1.5 text-sm font-medium transition ${
              filter === key
                ? "bg-black text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
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
          className="rounded border px-3 py-1.5 text-sm"
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
          className="rounded border px-3 py-1.5 text-sm"
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
          className="rounded border px-3 py-1.5 text-sm"
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
          className="rounded border px-3 py-1.5 text-sm"
        >
          <option value="">Any Mode</option>
          <option value="practice">Practice</option>
          <option value="test">Test</option>
        </select>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-gray-500">
          {total} mistake{total !== 1 ? "s" : ""} found
        </p>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded border p-4">
              <div className="h-5 w-48 rounded bg-gray-200" />
              <div className="mt-2 h-4 w-32 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && mistakes.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-gray-200 p-10 text-center">
          <p className="text-lg font-medium text-gray-600">
            No mistakes yet — keep practicing!
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Mistakes from your sessions will appear here for review.
          </p>
          <Link
            href="/mental-math"
            className="mt-4 inline-block rounded bg-black px-6 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Start a session
          </Link>
        </div>
      )}

      {/* Mistakes list */}
      {!loading && mistakes.length > 0 && (
        <div className="space-y-3">
          {mistakes.map((m, i) => (
            <div key={i} className="rounded border p-4">
              <div className="flex items-start justify-between">
                <p className="text-lg font-semibold font-mono">{m.prompt}</p>
                <div className="flex items-center gap-2">
                  {m.sessionMode && (
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {m.sessionMode}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-2 flex items-center gap-6 text-sm">
                {m.skipped ? (
                  <span className="font-medium text-yellow-600">Skipped</span>
                ) : (
                  <>
                    <span>
                      Your answer:{" "}
                      <span className="font-medium text-red-600">
                        {m.userAnswer ?? "—"}
                      </span>
                    </span>
                    <span>
                      Correct:{" "}
                      <span className="font-medium text-green-600">
                        {m.correctAnswer}
                      </span>
                    </span>
                  </>
                )}
                {m.responseTimeMs != null && (
                  <span className="text-gray-500">
                    {(m.responseTimeMs / 1000).toFixed(1)}s
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                  L{m.level}
                </span>
                <span className="rounded bg-purple-50 px-2 py-0.5 text-xs text-purple-700">
                  {m.operationType}
                </span>
                <span className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-700">
                  {m.numberType}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
