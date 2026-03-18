"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Preset {
  name: string;
  display_name: string;
  description: string;
  question_count: number;
  timer_seconds: number;
}

export default function TestPage() {
  const router = useRouter();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPresets() {
      try {
        const res = await fetch("/api/presets");
        if (!res.ok) throw new Error("Failed to fetch presets");
        const data = await res.json();
        setPresets(data.presets ?? data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load presets");
      } finally {
        setLoading(false);
      }
    }
    fetchPresets();
  }, []);

  async function handleSelect(presetName: string) {
    setStarting(presetName);
    setError(null);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "test",
          presetName,
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
      setStarting(null);
    }
  }

  function formatTimer(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (secs === 0) return `${mins} min`;
    return `${mins}m ${secs}s`;
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-lg font-medium text-foreground-bright">Test Mode</h1>
        <p className="text-foreground-muted">Loading presets...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-lg font-medium text-foreground-bright">Test Mode</h1>
      <p className="mb-6 text-sm text-foreground-muted">
        Select a preset to begin a timed test. Scoring: +1 correct, -1 wrong, 0
        skipped.
      </p>

      {error && <p className="mb-4 text-sm text-error">{error}</p>}

      {presets.length === 0 && !error && (
        <p className="text-foreground-muted">No presets available.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {presets.map((preset) => (
          <button
            key={preset.name}
            onClick={() => handleSelect(preset.name)}
            disabled={starting !== null}
            className={cn(
              "group rounded-lg border p-5 text-left transition-all duration-200 hover:scale-[1.01] disabled:opacity-50",
              starting === preset.name
                ? "border-foreground-muted bg-background-card"
                : "border-border bg-background-elevated hover:bg-background-card"
            )}
          >
            <h3 className="mb-1 font-medium text-foreground group-hover:text-foreground-bright">
              {preset.display_name}
            </h3>
            <p className="mb-3 text-sm text-foreground-muted">{preset.description}</p>
            <div className="flex gap-4 font-mono text-xs text-foreground-muted">
              <span>{preset.question_count} questions</span>
              <span>{formatTimer(preset.timer_seconds)}</span>
            </div>
            {starting === preset.name && (
              <p className="mt-2 text-xs text-foreground-muted">Starting...</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
