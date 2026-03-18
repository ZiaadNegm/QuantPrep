"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const LEVELS = ["L1", "L2", "L3", "L4", "L5"];
const OPERATIONS = ["Add", "Sub", "Mul", "Div"];
const NUMBER_TYPES = ["Integer", "Decimal", "Fraction"];

export default function PracticePage() {
  const router = useRouter();

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
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Practice Mode</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Levels */}
        <fieldset>
          <legend className="mb-2 font-medium">Levels</legend>
          <div className="flex flex-wrap gap-3">
            {LEVELS.map((level) => (
              <label key={level} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={selectedLevels.includes(level)}
                  onChange={() => toggleItem(selectedLevels, level, setSelectedLevels)}
                />
                {level}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Operations */}
        <fieldset>
          <legend className="mb-2 font-medium">Operations</legend>
          <div className="flex flex-wrap gap-3">
            {OPERATIONS.map((op) => (
              <label key={op} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={selectedOps.includes(op)}
                  onChange={() => toggleItem(selectedOps, op, setSelectedOps)}
                />
                {op}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Number Types */}
        <fieldset>
          <legend className="mb-2 font-medium">Number Types</legend>
          <div className="flex flex-wrap gap-3">
            {NUMBER_TYPES.map((t) => (
              <label key={t} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(t)}
                  onChange={() => toggleItem(selectedTypes, t, setSelectedTypes)}
                />
                {t}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Session Type */}
        <fieldset>
          <legend className="mb-2 font-medium">Session Type</legend>
          <div className="flex gap-4">
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="radio"
                name="sessionType"
                checked={sessionType === "finite"}
                onChange={() => setSessionType("finite")}
              />
              Finite
            </label>
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="radio"
                name="sessionType"
                checked={sessionType === "open-ended"}
                onChange={() => setSessionType("open-ended")}
              />
              Open-ended
            </label>
          </div>
        </fieldset>

        {/* Question Count */}
        {sessionType === "finite" && (
          <div>
            <label className="mb-1 block text-sm font-medium">
              Number of Questions
            </label>
            <input
              type="number"
              min={1}
              max={200}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-24 rounded border px-3 py-1.5 text-sm"
            />
          </div>
        )}

        {/* Timer */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={timerEnabled}
              onChange={(e) => setTimerEnabled(e.target.checked)}
            />
            Enable Timer
          </label>
          {timerEnabled && (
            <div>
              <label className="mb-1 block text-sm text-gray-600">
                Duration (minutes)
              </label>
              <input
                type="number"
                min={1}
                max={120}
                value={timerMinutes}
                onChange={(e) => setTimerMinutes(Number(e.target.value))}
                className="w-24 rounded border px-3 py-1.5 text-sm"
              />
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Starting..." : "Start Practice"}
        </button>
      </form>
    </div>
  );
}
