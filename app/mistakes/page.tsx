"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { cn, formatResponseTime } from "@/lib/utils";
import { RotateCcw } from "lucide-react";

// Mock mistake data
const mockMistakes = [
  {
    id: 1,
    prompt: "47 + 86",
    userAnswer: "123",
    correctAnswer: "133",
    responseTime: 2300,
    operation: "addition",
    numberType: "integer",
    level: "L2",
    date: "Mar 17",
    mode: "Practice",
    isSkipped: false,
  },
  {
    id: 2,
    prompt: "3/4 + 1/2",
    userAnswer: null,
    correctAnswer: "5/4",
    responseTime: 8100,
    operation: "addition",
    numberType: "fraction",
    level: "L4",
    date: "Mar 17",
    mode: "Optiver 80 in 8",
    isSkipped: true,
  },
  {
    id: 3,
    prompt: "15 × 17",
    userAnswer: "245",
    correctAnswer: "255",
    responseTime: 5400,
    operation: "multiplication",
    numberType: "integer",
    level: "L3",
    date: "Mar 16",
    mode: "Practice",
    isSkipped: false,
  },
  {
    id: 4,
    prompt: "4.5 - 1.8",
    userAnswer: "2.3",
    correctAnswer: "2.7",
    responseTime: 3200,
    operation: "subtraction",
    numberType: "decimal",
    level: "L3",
    date: "Mar 16",
    mode: "Practice",
    isSkipped: false,
  },
  {
    id: 5,
    prompt: "144 ÷ 12",
    userAnswer: "11",
    correctAnswer: "12",
    responseTime: 2100,
    operation: "division",
    numberType: "integer",
    level: "L2",
    date: "Mar 15",
    mode: "Mixed Sprint 40",
    isSkipped: false,
  },
  {
    id: 6,
    prompt: "2/3 × 3/4",
    userAnswer: null,
    correctAnswer: "1/2",
    responseTime: 10000,
    operation: "multiplication",
    numberType: "fraction",
    level: "L4",
    date: "Mar 15",
    mode: "Practice",
    isSkipped: true,
  },
  {
    id: 7,
    prompt: "? + 45 = 112",
    userAnswer: "57",
    correctAnswer: "67",
    responseTime: 4500,
    operation: "addition",
    numberType: "integer",
    level: "L3",
    date: "Mar 14",
    mode: "Practice",
    isSkipped: false,
  },
  {
    id: 8,
    prompt: "17²",
    userAnswer: "279",
    correctAnswer: "289",
    responseTime: 6800,
    operation: "multiplication",
    numberType: "integer",
    level: "L5",
    date: "Mar 14",
    mode: "Optiver 80 in 8",
    isSkipped: false,
  },
];

type FilterTab = "all" | "incorrect" | "skipped";

export default function MistakesPage() {
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [operationFilter, setOperationFilter] = useState<string>("all");
  const [numberTypeFilter, setNumberTypeFilter] = useState<string>("all");

  const filteredMistakes = mockMistakes.filter((m) => {
    if (filterTab === "incorrect" && m.isSkipped) return false;
    if (filterTab === "skipped" && !m.isSkipped) return false;
    if (levelFilter !== "all" && m.level !== levelFilter) return false;
    if (operationFilter !== "all" && m.operation !== operationFilter) return false;
    if (numberTypeFilter !== "all" && m.numberType !== numberTypeFilter) return false;
    return true;
  });

  const hasData = mockMistakes.length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header isLoggedIn={true} />

      <main className="flex flex-1 flex-col px-6 py-20">
        <div className="mx-auto w-full max-w-4xl">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-lg font-medium text-foreground-bright">
            Mistakes Review
          </h1>
          <Link
            href="/mental-math"
            className="text-sm text-foreground-muted transition-colors hover:text-foreground"
          >
            Start New Session
          </Link>
        </div>

        {hasData ? (
          <>
            {/* Filter Tabs */}
            <div className="mb-6 flex items-center gap-4 border-b border-border-subtle">
              {(["all", "incorrect", "skipped"] as FilterTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={cn(
                    "border-b-2 pb-3 text-sm capitalize transition-colors",
                    filterTab === tab
                      ? "border-foreground-muted text-foreground-bright"
                      : "border-transparent text-foreground-muted hover:text-foreground"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Compact Filters */}
            <div className="mb-6 flex flex-wrap gap-4">
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="rounded-md border border-border bg-background-elevated px-3 py-1.5 text-sm text-foreground outline-none focus:border-foreground-muted"
              >
                <option value="all">All Levels</option>
                <option value="L1">L1</option>
                <option value="L2">L2</option>
                <option value="L3">L3</option>
                <option value="L4">L4</option>
                <option value="L5">L5</option>
              </select>

              <select
                value={operationFilter}
                onChange={(e) => setOperationFilter(e.target.value)}
                className="rounded-md border border-border bg-background-elevated px-3 py-1.5 text-sm text-foreground outline-none focus:border-foreground-muted"
              >
                <option value="all">All Operations</option>
                <option value="addition">Addition</option>
                <option value="subtraction">Subtraction</option>
                <option value="multiplication">Multiplication</option>
                <option value="division">Division</option>
              </select>

              <select
                value={numberTypeFilter}
                onChange={(e) => setNumberTypeFilter(e.target.value)}
                className="rounded-md border border-border bg-background-elevated px-3 py-1.5 text-sm text-foreground outline-none focus:border-foreground-muted"
              >
                <option value="all">All Types</option>
                <option value="integer">Integer</option>
                <option value="decimal">Decimal</option>
                <option value="fraction">Fraction</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            {/* Mistakes List */}
            <div className="space-y-3">
              {filteredMistakes.length > 0 ? (
                filteredMistakes.map((mistake) => (
                  <div
                    key={mistake.id}
                    className="rounded-lg border border-border-subtle bg-background-elevated p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      {/* Question and Answer */}
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="font-mono text-lg text-foreground-bright">
                          {mistake.prompt}
                        </span>
                        <span className="text-foreground-muted">=</span>
                        {mistake.isSkipped ? (
                          <span className="font-mono text-foreground-muted italic">
                            skipped
                          </span>
                        ) : (
                          <span className="font-mono text-error line-through">
                            {mistake.userAnswer}
                          </span>
                        )}
                        <span className="font-mono text-success">
                          {mistake.correctAnswer}
                        </span>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-xs text-foreground-muted">
                        <span className="font-mono">
                          {formatResponseTime(mistake.responseTime)}
                        </span>
                        <span className="rounded bg-background-card px-2 py-0.5 font-mono">
                          {mistake.level}
                        </span>
                        <span className="capitalize">{mistake.operation}</span>
                        <span className="capitalize">{mistake.numberType}</span>
                      </div>
                    </div>

                    {/* Source info and retry */}
                    <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-3">
                      <span className="text-xs text-foreground-muted">
                        {mistake.date} / {mistake.mode}
                      </span>
                      <button className="flex items-center gap-1.5 text-xs text-foreground-muted transition-colors hover:text-foreground">
                        <RotateCcw className="h-3 w-3" />
                        Retry
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-foreground-muted">
                    No mistakes match your filters
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-24">
            <p className="mb-2 text-foreground">No mistakes saved yet</p>
            <p className="mb-6 text-sm text-foreground-muted">
              Complete a session to start reviewing mistakes
            </p>
            <Link
              href="/mental-math"
              className="rounded-lg border border-foreground-muted bg-background-card px-6 py-2.5 text-sm font-medium text-foreground-bright transition-all hover:bg-background-hover"
            >
              Start a Session
            </Link>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
