"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LivingPixels } from "@/components/living-pixels";

const LEVELS = ["L1", "L2", "L3", "L4", "L5"];
const OPERATIONS = ["Add", "Sub", "Mul", "Div"];
const NUMBER_TYPES = ["Integer", "Decimal", "Fraction"];
const QUESTION_PRESETS = [10, 20, 40, 80];
const TIMER_PRESETS = [3, 5, 10, 15];

const LEVEL_INFO = [
  { id: "L1", label: "Novice", target: "< 2s" },
  { id: "L2", label: "Associate", target: "< 5s" },
  { id: "L3", label: "Professional", target: "< 7s" },
  { id: "L4", label: "Expert", target: "< 10s" },
  { id: "L5", label: "Master", target: "< 15s" },
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
        <div className="flex flex-1 flex-col items-center justify-center px-4 md:px-20 py-24">
          <div className="w-full max-w-6xl">
            <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-4 mb-16">
              {LEVEL_INFO.map((level) => {
                const selected = selectedLevels.includes(level.id);
                return (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => toggleItem(selectedLevels, level.id, setSelectedLevels)}
                    className={cn(
                      "group relative w-full aspect-square md:w-48 bg-[#1c1b1b] overflow-hidden flex flex-col items-center justify-center rounded-xl transition-all duration-300 cursor-pointer",
                      selected
                        ? "border border-white/20"
                        : "border border-transparent hover:border-white/10 hover:bg-[#2a2a2a] hover:scale-[1.05]"
                    )}
                  >
                    <div className={cn(
                      "absolute inset-0 card-bg-pattern transition-opacity duration-500",
                      selected ? "opacity-40" : "opacity-20 group-hover:opacity-40"
                    )} />
                    <LivingPixels count={selected ? 12 : 6} className={selected ? undefined : "opacity-50"} />
                    <span className="relative z-10 text-6xl font-semibold tracking-tighter text-white">
                      {level.id}
                    </span>
                    <span className={cn(
                      "relative z-10 uppercase tracking-[0.15em] text-[10px] mt-2 transition-colors",
                      selected ? "text-white" : "text-[#737373] group-hover:text-white"
                    )}>
                      {level.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-16 py-4 bg-[#2a2a2a] text-white text-sm font-semibold uppercase tracking-[0.2em] border border-[rgba(64,64,64,0.3)] hover:bg-[#404040] transition-all duration-300 rounded-xl cursor-pointer"
              >
                Continue
              </button>
              <p className="mt-8 text-[10px] tracking-[0.15em] uppercase text-[#737373]">
                Select a difficulty level to initialize training module
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Operations + Number Types */}
      {step === 2 && (
        <div className="flex flex-1 flex-col items-center justify-center px-4 md:px-20 py-24">
          <div className="w-full max-w-5xl space-y-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {OPERATIONS.map((op) => {
                const selected = selectedOps.includes(op);
                return (
                  <button
                    key={op}
                    type="button"
                    onClick={() => toggleItem(selectedOps, op, setSelectedOps)}
                    className={cn(
                      "group relative aspect-square bg-[#1c1b1b] overflow-hidden flex flex-col items-center justify-center rounded-xl transition-all duration-300 cursor-pointer",
                      selected
                        ? "border border-white/20 scale-[1.05]"
                        : "border border-transparent hover:border-white/10 hover:bg-[#2a2a2a] hover:scale-[1.05]"
                    )}
                  >
                    <div className={cn(
                      "absolute inset-0 card-bg-pattern transition-opacity duration-500",
                      selected ? "opacity-40" : "opacity-20 group-hover:opacity-40"
                    )} />
                    <LivingPixels />
                    <span className="relative z-10 text-6xl text-white mb-4">
                      {OP_SYMBOLS[op]}
                    </span>
                    <span className={cn(
                      "relative z-10 font-semibold tracking-widest uppercase text-[0.625rem] transition-colors",
                      selected ? "text-white" : "text-[#737373] group-hover:text-white"
                    )}>
                      {op === "Add" ? "Addition" : op === "Sub" ? "Subtraction" : op === "Mul" ? "Multiplication" : "Division"}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col items-center space-y-8">
              <div className="flex gap-16 md:gap-32">
                {NUMBER_TYPES.map((t) => {
                  const selected = selectedTypes.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleItem(selectedTypes, t, setSelectedTypes)}
                      className="group relative cursor-pointer"
                    >
                      <span className={cn(
                        "font-semibold tracking-[0.25em] uppercase text-[0.75rem] transition-colors",
                        selected ? "text-white" : "text-[#737373] hover:text-white"
                      )}>
                        {t === "Integer" ? "Integers" : t === "Decimal" ? "Decimals" : "Fractions"}
                      </span>
                      <div className={cn(
                        "absolute -bottom-2 left-0 h-[1px] bg-white transition-all duration-300",
                        selected ? "w-full" : "w-0 group-hover:w-full"
                      )} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col items-center pt-8">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-10 py-4 bg-transparent text-[#a3a3a3] text-sm font-semibold uppercase tracking-[0.2em] border border-[rgba(64,64,64,0.3)] hover:bg-[#2a2a2a] transition-all duration-300 rounded-xl cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-16 py-4 bg-[#2a2a2a] text-white text-sm font-semibold uppercase tracking-[0.2em] border border-[rgba(64,64,64,0.3)] hover:bg-[#404040] transition-all duration-300 rounded-xl cursor-pointer"
                >
                  Continue
                </button>
              </div>
              <p className="mt-8 text-[10px] tracking-[0.15em] uppercase text-[#737373]">
                Select arithmetic parameters to initialize training session
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Session Settings + Start */}
      {step === 3 && (
        <div className="flex flex-1 flex-col items-center justify-center">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg space-y-8 rounded-xl border border-[#333] bg-[#1a1a1a] p-8"
          >
            {/* Session Type */}
            <div>
              <span className="mb-2 block text-sm text-[#737373]">Session Type</span>
              <div className="flex gap-2">
                {(["finite", "open-ended"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSessionType(type)}
                    className={cn(
                      "rounded-xl border px-4 py-2 text-sm transition-all",
                      sessionType === type
                        ? "border-[#a3a3a3] bg-[#222] text-white"
                        : "border-[#333] text-[#737373] hover:border-[#a3a3a3] hover:text-[#a3a3a3]"
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
                <span className="mb-2 block text-sm text-[#737373]">Number of Questions</span>
                <div className="flex flex-wrap gap-2">
                  {QUESTION_PRESETS.map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setQuestionCount(count)}
                      className={cn(
                        "rounded-xl border px-4 py-2 text-sm transition-all",
                        questionCount === count
                          ? "border-[#a3a3a3] bg-[#222] text-white"
                          : "border-[#333] text-[#737373] hover:border-[#a3a3a3] hover:text-[#a3a3a3]"
                      )}
                    >
                      {count}
                    </button>
                  ))}
                  {!QUESTION_PRESETS.includes(questionCount) && (
                    <span className="rounded-xl border border-[#a3a3a3] bg-[#222] px-4 py-2 text-sm text-white">
                      {questionCount}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Timer */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#737373]">Timer</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={timerEnabled}
                  onClick={() => setTimerEnabled(!timerEnabled)}
                  className={cn(
                    "relative h-5 w-9 rounded-full transition-colors",
                    timerEnabled ? "bg-[#737373]" : "bg-[#333]"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-4 w-4 rounded-full bg-[#1a1a1a] transition-transform",
                      timerEnabled ? "left-4" : "left-0.5"
                    )}
                  />
                </button>
              </div>
              {timerEnabled && (
                <div>
                  <span className="mb-2 block text-sm text-[#737373]">
                    Duration (minutes)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {TIMER_PRESETS.map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setTimerMinutes(mins)}
                        className={cn(
                          "rounded-xl border px-4 py-2 text-sm transition-all",
                          timerMinutes === mins
                            ? "border-[#a3a3a3] bg-[#222] text-white"
                            : "border-[#333] text-[#737373] hover:border-[#a3a3a3] hover:text-[#a3a3a3]"
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
                className="px-10 py-4 bg-transparent text-[#a3a3a3] text-sm font-semibold uppercase tracking-[0.2em] border border-[rgba(64,64,64,0.3)] hover:bg-[#2a2a2a] transition-all duration-300 rounded-xl cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-16 py-4 bg-[#2a2a2a] text-white text-sm font-semibold uppercase tracking-[0.2em] border border-[rgba(64,64,64,0.3)] hover:bg-[#404040] transition-all duration-300 rounded-xl cursor-pointer disabled:opacity-50"
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
