"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
        <h1 className="mb-6 text-2xl font-bold">Test Mode</h1>
        <p className="text-gray-500">Loading presets...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold">Test Mode</h1>
      <p className="mb-6 text-sm text-gray-600">
        Select a preset to begin a timed test. Scoring: +1 correct, -1 wrong, 0
        skipped.
      </p>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {presets.length === 0 && !error && (
        <p className="text-gray-500">No presets available.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {presets.map((preset) => (
          <button
            key={preset.name}
            onClick={() => handleSelect(preset.name)}
            disabled={starting !== null}
            className="rounded-lg border-2 border-gray-200 p-5 text-left transition hover:border-blue-400 hover:shadow-md disabled:opacity-50"
          >
            <h3 className="mb-1 font-semibold">{preset.display_name}</h3>
            <p className="mb-3 text-sm text-gray-600">{preset.description}</p>
            <div className="flex gap-4 text-xs text-gray-500">
              <span>{preset.question_count} questions</span>
              <span>{formatTimer(preset.timer_seconds)}</span>
            </div>
            {starting === preset.name && (
              <p className="mt-2 text-xs text-blue-600">Starting...</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
