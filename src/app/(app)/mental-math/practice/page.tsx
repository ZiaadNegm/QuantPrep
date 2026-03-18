"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const LEVELS = ["L1", "L2", "L3", "L4", "L5"];
const OPERATIONS = ["Add", "Sub", "Mul", "Div"];
const NUMBER_TYPES = ["Integer", "Decimal", "Fraction"];
const QUESTION_PRESETS = [10, 20, 40, 80];
const TIMER_PRESETS = [3, 5, 10, 15];

const LEVEL_INFO = [
  { id: "L1", label: "Easy", target: "< 2s" },
  { id: "L2", label: "Medium", target: "< 5s" },
  { id: "L3", label: "Hard", target: "< 7s" },
  { id: "L4", label: "Very Hard", target: "< 10s" },
  { id: "L5", label: "Elite", target: "< 15s" },
];

const OP_SYMBOLS: Record<string, string> = {
  Add: "+",
  Sub: "\u2212",
  Mul: "\u00d7",
  Div: "\u00f7",
};

export default function PracticePage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [selectedLevels, setSelectedLevels] = useState<string[]>(["L1"]);
  const [selectedOps, setSelectedOps] = useState<string[]>(["Add"]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["Integer"]);
  const [sessionType, setSessionType] = useState<"finite" | "open-ended">("finite");
  const [questionCount, setQuestionCount] = useState(20);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleItem(list: string[], item: string, setter: (v: string[]) => void) {
    if (list.includes(item)) {
      if (list.length > 1) setter(list.filter((i) => i !== item));
    } else {
      setter([...list, item]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "practice",
          config: {
            levels: selectedLevels.map((l) => parseInt(l.replace("L", ""))),
            operations: selectedOps.map((o) => o.toLowerCase()),
            numberTypes: selectedTypes.map((t) => t.toLowerCase()),
            sessionType,
            questionCount: sessionType === "finite" ? questionCount : null,
            timerEnabled,
            timerDurationSeconds: timerEnabled ? timerMinutes * 60 : null,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create session");
      }

      const data = await res.json();
      router.push(`/mental-math/session/${data.sessionId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Step 1: Level Selection */}
      {step === 1 && (
        <div className="flex flex-1 flex-col items-center justify-center px-8">
          <div className="grid w-full max-w-6xl grid-cols-5 gap-4">
            {LEVEL_INFO.map((level) => {
              const selected = selectedLevels.includes(level.id);
              return (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => toggleItem(selectedLevels, level.id, setSelectedLevels)}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg border p-8 sm:p-10 transition-all duration-200 cursor-pointer",
                    selected
                      ? "border-foreground-muted bg-background-card scale-[1.02]"
                      : "border-border bg-background-elevated hover:bg-background-card hover:scale-[1.01]"
                  )}
                >
                  <span
                    className={cn(
                      "font-mono text-5xl sm:text-7xl font-bold",
                      selected ? "text-foreground-bright" : "text-foreground"
                    )}
                  >
                    {level.id}
                  </span>
                  <span className="mt-3 text-sm text-foreground-muted">{level.label}</span>
                  <span className="mt-1 text-xs text-foreground-muted">{level.target}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            className="mt-10 w-full max-w-xs rounded-lg border border-foreground-muted bg-background-card px-8 py-3 font-mono font-medium text-foreground-bright transition-all cursor-pointer hover:scale-[1.02] hover:bg-background-hover"
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Operations + Number Types */}
      {step === 2 && (
        <div className="flex flex-1 flex-col items-center justify-center px-8">
          <div className="grid w-full max-w-xl grid-cols-4 gap-4">
            {OPERATIONS.map((op) => {
              const selected = selectedOps.includes(op);
              return (
                <button
                  key={op}
                  type="button"
                  onClick={() => toggleItem(selectedOps, op, setSelectedOps)}
                  className={cn(
                    "flex items-center justify-center aspect-square rounded-lg border font-mono text-4xl sm:text-5xl transition-all duration-200 cursor-pointer",
                    selected
                      ? "border-foreground-muted bg-background-card scale-[1.02] text-foreground-bright"
                      : "border-border bg-background-elevated hover:bg-background-card hover:scale-[1.01] text-foreground"
                  )}
                >
                  {OP_SYMBOLS[op]}
                </button>
              );
            })}
          </div>

          <div className="mt-10 grid w-full max-w-xl grid-cols-3 gap-4">
            {NUMBER_TYPES.map((t) => {
              const selected = selectedTypes.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleItem(selectedTypes, t, setSelectedTypes)}
                  className={cn(
                    "flex items-center justify-center rounded-lg border px-6 py-6 text-lg font-medium transition-all duration-200 cursor-pointer",
                    selected
                      ? "border-foreground-muted bg-background-card scale-[1.02] text-foreground-bright"
                      : "border-border bg-background-elevated hover:bg-background-card hover:scale-[1.01] text-foreground"
                  )}
                >
                  {t}
                </button>
              );
            })}
          </div>

          <div className="mt-10 flex gap-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-lg border border-border px-6 py-3 font-mono text-foreground-muted cursor-pointer transition-all hover:scale-[1.01] hover:bg-background-hover"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="rounded-lg border border-foreground-muted bg-background-card px-8 py-3 font-mono font-medium text-foreground-bright cursor-pointer transition-all hover:scale-[1.02] hover:bg-background-hover"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Session Settings + Start */}
      {step === 3 && (
        <div className="flex flex-1 flex-col items-center justify-center">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg space-y-8 rounded-lg border border-border-subtle bg-background-elevated p-8"
          >
            {/* Session Type */}
            <div>
              <span className="mb-2 block text-sm text-foreground-muted">Session Type</span>
              <div className="flex gap-2">
                {(["finite", "open-ended"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSessionType(type)}
                    className={cn(
                      "rounded-md border px-4 py-2 font-mono text-sm transition-all",
                      sessionType === type
                        ? "border-foreground-muted bg-background-card text-foreground-bright"
                        : "border-border text-foreground-muted hover:border-foreground-muted hover:text-foreground"
                    )}
                  >
                    {type === "finite" ? "Finite" : "Open-ended"}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Count */}
            {sessionType === "finite" && (
              <div>
                <span className="mb-2 block text-sm text-foreground-muted">Number of Questions</span>
                <div className="flex flex-wrap gap-2">
                  {QUESTION_PRESETS.map((count) => (
                    <button
                      key={count}
                      type="button"
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
                  {!QUESTION_PRESETS.includes(questionCount) && (
                    <span className="rounded-md border border-foreground-muted bg-background-card px-4 py-2 font-mono text-sm text-foreground-bright">
                      {questionCount}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Timer */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-foreground-muted">Timer</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={timerEnabled}
                  onClick={() => setTimerEnabled(!timerEnabled)}
                  className={cn(
                    "relative h-5 w-9 rounded-full transition-colors",
                    timerEnabled ? "bg-foreground-muted" : "bg-border"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-4 w-4 rounded-full bg-background-card transition-transform",
                      timerEnabled ? "left-4" : "left-0.5"
                    )}
                  />
                </button>
              </div>
              {timerEnabled && (
                <div>
                  <span className="mb-2 block text-sm text-foreground-muted">
                    Duration (minutes)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {TIMER_PRESETS.map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setTimerMinutes(mins)}
                        className={cn(
                          "rounded-md border px-4 py-2 font-mono text-sm transition-all",
                          timerMinutes === mins
                            ? "border-foreground-muted bg-background-card text-foreground-bright"
                            : "border-border text-foreground-muted hover:border-foreground-muted hover:text-foreground"
                        )}
                      >
                        {mins}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {error && <p className="text-sm text-error">{error}</p>}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-lg border border-border px-6 py-3 font-mono text-foreground-muted cursor-pointer transition-all hover:scale-[1.01] hover:bg-background-hover"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg border border-foreground-muted bg-background-card px-8 py-3 font-mono font-medium text-foreground-bright cursor-pointer transition-all hover:scale-[1.02] hover:bg-background-hover disabled:opacity-50"
              >
                {submitting ? "Starting..." : "Start Practice"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
