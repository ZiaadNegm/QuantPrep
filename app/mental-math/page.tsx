"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { cn } from "@/lib/utils";
import {
  Difficulty,
  Mode,
  SessionType,
  Operation,
  NumberType,
  TEST_PRESETS,
  DIFFICULTY_INFO,
  QUESTION_COUNTS,
  TIMER_DURATIONS,
} from "@/lib/types";

const difficulties: Difficulty[] = ["L1", "L2", "L3", "L4", "L5"];

const operations: { value: Operation; label: string }[] = [
  { value: "addition", label: "+" },
  { value: "subtraction", label: "-" },
  { value: "multiplication", label: "x" },
  { value: "division", label: "/" },
];

const numberTypes: { value: NumberType; label: string }[] = [
  { value: "integer", label: "Integer" },
  { value: "decimal", label: "Decimal" },
  { value: "fraction", label: "Fraction" },
  { value: "mixed", label: "Mixed" },
];

export default function MentalMathSetupPage() {
  const router = useRouter();
  
  // Mode state
  const [mode, setMode] = useState<Mode>("practice");
  
  // Practice config state
  const [difficulty, setDifficulty] = useState<Difficulty>("L1");
  const [sessionType, setSessionType] = useState<SessionType>("finite");
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerDuration, setTimerDuration] = useState<number>(300);
  const [selectedOperations, setSelectedOperations] = useState<Operation[]>([
    "addition",
    "subtraction",
    "multiplication",
    "division",
  ]);
  const [selectedNumberTypes, setSelectedNumberTypes] = useState<NumberType[]>([
    "integer",
  ]);
  
  // Test config state
  const [selectedPreset, setSelectedPreset] = useState<string>("optiver-80-8");

  const toggleOperation = (op: Operation) => {
    if (selectedOperations.includes(op)) {
      if (selectedOperations.length > 1) {
        setSelectedOperations(selectedOperations.filter((o) => o !== op));
      }
    } else {
      setSelectedOperations([...selectedOperations, op]);
    }
  };

  const toggleNumberType = (nt: NumberType) => {
    if (selectedNumberTypes.includes(nt)) {
      if (selectedNumberTypes.length > 1) {
        setSelectedNumberTypes(selectedNumberTypes.filter((n) => n !== nt));
      }
    } else {
      setSelectedNumberTypes([...selectedNumberTypes, nt]);
    }
  };

  const handleStart = () => {
    const params = new URLSearchParams();
    
    if (mode === "practice") {
      params.set("mode", "practice");
      params.set("difficulty", difficulty);
      params.set("sessionType", sessionType);
      if (sessionType === "finite") {
        params.set("questionCount", questionCount.toString());
      }
      if (timerEnabled) {
        params.set("timer", timerDuration.toString());
      }
      params.set("operations", selectedOperations.join(","));
      params.set("numberTypes", selectedNumberTypes.join(","));
    } else {
      params.set("mode", "test");
      params.set("preset", selectedPreset);
    }
    
    router.push(`/mental-math/session?${params.toString()}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header isLoggedIn={true} />

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20">
        <div className="w-full max-w-3xl">

        {/* Mode Toggle */}
        <div className="mb-10 flex justify-center">
          <div className="flex rounded-lg border border-border bg-background-elevated p-1">
            <button
              onClick={() => setMode("practice")}
              className={cn(
                "rounded-md px-6 py-2 text-sm font-medium transition-all",
                mode === "practice"
                  ? "bg-background-card text-foreground-bright"
                  : "text-foreground-muted hover:text-foreground"
              )}
            >
              Practice
            </button>
            <button
              onClick={() => setMode("test")}
              className={cn(
                "rounded-md px-6 py-2 text-sm font-medium transition-all",
                mode === "test"
                  ? "bg-background-card text-foreground-bright"
                  : "text-foreground-muted hover:text-foreground"
              )}
            >
              Test
            </button>
          </div>
        </div>

        {mode === "practice" ? (
          <>
            {/* Difficulty Selection */}
            <section className="mb-12">
              <h2 className="mb-4 text-center text-xs uppercase tracking-wider text-foreground-muted">
                Difficulty
              </h2>
              <div className="flex justify-center gap-3">
                {difficulties.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={cn(
                      "group relative flex h-24 w-24 flex-col items-center justify-center rounded-lg border transition-all duration-200 hover:scale-[1.02]",
                      difficulty === d
                        ? "border-foreground-muted bg-background-card"
                        : "border-border bg-background-elevated hover:bg-background-card"
                    )}
                  >
                    <span
                      className={cn(
                        "font-mono text-2xl font-semibold transition-colors",
                        difficulty === d
                          ? "text-foreground-bright"
                          : "text-foreground group-hover:text-foreground-bright"
                      )}
                    >
                      {d}
                    </span>
                    <span className="mt-1 text-xs text-foreground-muted">
                      {DIFFICULTY_INFO[d].targetTime}
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-center text-xs text-foreground-muted">
                {DIFFICULTY_INFO[difficulty].description}
              </p>
            </section>

            {/* Additional Options */}
            <section className="space-y-8 rounded-lg border border-border-subtle bg-background-elevated p-6">
              <h3 className="text-xs uppercase tracking-wider text-foreground-muted">
                Options
              </h3>

              {/* Session Type */}
              <div>
                <label className="mb-2 block text-sm text-foreground-muted">
                  Session Type
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSessionType("finite")}
                    className={cn(
                      "rounded-md border px-4 py-2 text-sm transition-all",
                      sessionType === "finite"
                        ? "border-foreground-muted bg-background-card text-foreground-bright"
                        : "border-border text-foreground-muted hover:border-foreground-muted hover:text-foreground"
                    )}
                  >
                    Finite
                  </button>
                  <button
                    onClick={() => setSessionType("open-ended")}
                    className={cn(
                      "rounded-md border px-4 py-2 text-sm transition-all",
                      sessionType === "open-ended"
                        ? "border-foreground-muted bg-background-card text-foreground-bright"
                        : "border-border text-foreground-muted hover:border-foreground-muted hover:text-foreground"
                    )}
                  >
                    Open-ended
                  </button>
                </div>
              </div>

              {/* Question Count (only for finite) */}
              {sessionType === "finite" && (
                <div>
                  <label className="mb-2 block text-sm text-foreground-muted">
                    Questions
                  </label>
                  <div className="flex gap-2">
                    {QUESTION_COUNTS.map((count) => (
                      <button
                        key={count}
                        onClick={() => setQuestionCount(count)}
                        className={cn(
                          "rounded-md border px-4 py-2 font-mono text-sm transition-all",
                          questionCount === count
                            ? "border-foreground-muted bg-background-card text-foreground-bright"
                            : "border-border text-foreground-muted hover:border-foreground-muted hover:text-foreground"
                        )}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Timer */}
              <div>
                <label className="mb-2 flex items-center gap-3 text-sm text-foreground-muted">
                  <span>Timer</span>
                  <button
                    onClick={() => setTimerEnabled(!timerEnabled)}
                    className={cn(
                      "relative h-5 w-9 rounded-full transition-colors",
                      timerEnabled ? "bg-foreground-muted" : "bg-border"
                    )}
                    role="switch"
                    aria-checked={timerEnabled}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-4 w-4 rounded-full bg-background-card transition-transform",
                        timerEnabled ? "left-4" : "left-0.5"
                      )}
                    />
                  </button>
                </label>
                {timerEnabled && (
                  <div className="mt-2 flex gap-2">
                    {TIMER_DURATIONS.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setTimerDuration(t.value)}
                        className={cn(
                          "rounded-md border px-4 py-2 font-mono text-sm transition-all",
                          timerDuration === t.value
                            ? "border-foreground-muted bg-background-card text-foreground-bright"
                            : "border-border text-foreground-muted hover:border-foreground-muted hover:text-foreground"
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Operations */}
              <div>
                <label className="mb-2 block text-sm text-foreground-muted">
                  Operations
                </label>
                <div className="flex gap-2">
                  {operations.map((op) => (
                    <button
                      key={op.value}
                      onClick={() => toggleOperation(op.value)}
                      className={cn(
                        "h-10 w-10 rounded-md border font-mono text-lg transition-all",
                        selectedOperations.includes(op.value)
                          ? "border-foreground-muted bg-background-card text-foreground-bright"
                          : "border-border text-foreground-muted hover:border-foreground-muted hover:text-foreground"
                      )}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number Types */}
              <div>
                <label className="mb-2 block text-sm text-foreground-muted">
                  Number Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {numberTypes.map((nt) => (
                    <button
                      key={nt.value}
                      onClick={() => toggleNumberType(nt.value)}
                      className={cn(
                        "rounded-md border px-4 py-2 text-sm transition-all",
                        selectedNumberTypes.includes(nt.value)
                          ? "border-foreground-muted bg-background-card text-foreground-bright"
                          : "border-border text-foreground-muted hover:border-foreground-muted hover:text-foreground"
                      )}
                    >
                      {nt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scoring Note */}
              <p className="text-xs text-foreground-muted">
                Scoring: +1 correct, 0 wrong/skipped
              </p>
            </section>
          </>
        ) : (
          <>
            {/* Test Presets */}
            <section>
              <h2 className="mb-6 text-center text-xs uppercase tracking-wider text-foreground-muted">
                Select a Test
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {TEST_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset.id)}
                    className={cn(
                      "group flex flex-col items-start rounded-lg border p-5 text-left transition-all duration-200 hover:scale-[1.01]",
                      selectedPreset === preset.id
                        ? "border-foreground-muted bg-background-card"
                        : "border-border bg-background-elevated hover:bg-background-card"
                    )}
                  >
                    <span
                      className={cn(
                        "font-medium transition-colors",
                        selectedPreset === preset.id
                          ? "text-foreground-bright"
                          : "text-foreground group-hover:text-foreground-bright"
                      )}
                    >
                      {preset.name}
                    </span>
                    <span className="mt-1 font-mono text-xs text-foreground-muted">
                      {preset.questionCount} questions /{" "}
                      {Math.floor(preset.timeLimit / 60)}m
                    </span>
                  </button>
                ))}
              </div>

              {/* Scoring Note */}
              <p className="mt-6 text-center text-xs text-foreground-muted">
                Scoring: +1 correct, -1 wrong, 0 skipped
              </p>
            </section>
          </>
        )}

        {/* Start Button */}
        <div className="mt-10 flex justify-center">
          <button
            onClick={handleStart}
            className="rounded-lg border border-foreground-muted bg-background-card px-8 py-3 font-medium text-foreground-bright transition-all hover:scale-[1.02] hover:bg-background-hover"
          >
            Start Session
          </button>
        </div>
        </div>
      </main>
    </div>
  );
}
