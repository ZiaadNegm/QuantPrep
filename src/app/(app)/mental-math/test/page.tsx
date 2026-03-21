"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LivingPixels } from "@/components/living-pixels";

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
      <div className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="mb-6 text-3xl font-semibold text-white">Test Mode</h1>
        <p className="text-[#737373]">Loading presets...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="mb-2 text-3xl font-semibold text-white">Test Mode</h1>
      <p className="mb-6 text-sm text-[#737373]">
        Select a preset to begin a timed test. Scoring: +1 correct, -1 wrong, 0
        skipped.
      </p>

      {error && <p className="mb-4 text-sm text-error">{error}</p>}

      {presets.length === 0 && !error && (
        <p className="text-[#737373]">No presets available.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {presets.map((preset) => (
          <button
            key={preset.name}
            onClick={() => handleSelect(preset.name)}
            disabled={starting !== null}
            className={cn(
              "group relative rounded-xl border p-5 text-left transition-all duration-300 hover:scale-[1.01] disabled:opacity-50 overflow-hidden",
              starting === preset.name
                ? "border-[#a3a3a3] bg-[#1a1a1a]"
                : "border-[rgba(64,64,64,0.5)] bg-[#1a1a1a] hover:bg-[#222]"
            )}
          >
            <div className="absolute inset-0 card-bg-pattern opacity-20 group-hover:opacity-30 transition-opacity" />
            <LivingPixels count={6} className="opacity-50" />
            <h3 className="relative z-10 mb-1 font-medium text-[#a3a3a3] group-hover:text-white transition-colors">
              {preset.display_name}
            </h3>
            <p className="relative z-10 mb-3 text-sm text-[#737373]">{preset.description}</p>
            <div className="relative z-10 flex gap-4 font-mono text-xs text-[#737373]">
              <span>{preset.question_count} questions</span>
              <span>{formatTimer(preset.timer_seconds)}</span>
            </div>
            {starting === preset.name && (
              <p className="relative z-10 mt-2 text-xs text-[#737373]">Starting...</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
