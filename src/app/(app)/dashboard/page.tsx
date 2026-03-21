"use client";

import { useEffect, useState } from "react";
import { ModuleTile } from "@/components/module-tile";
import { StatBlock } from "@/components/stat-block";

interface Stats {
  totalSessions: number;
  totalQuestionsAnswered: number;
  currentStreak: number;
  recentSnapshot: {
    avgAccuracy: number;
    avgResponseTimeMs: number;
    percentWithinTarget: number;
  };
}

const modules = [
  { title: "Mental Math", href: "/mental-math", isActive: true },
  { title: "Coming Soon", isLocked: true },
  { title: "Coming Soon", isLocked: true },
  { title: "Coming Soon", isLocked: true },
  { title: "Coming Soon", isLocked: true },
  { title: "Coming Soon", isLocked: true },
  { title: "Coming Soon", isLocked: true },
  { title: "Coming Soon", isLocked: true },
  { title: "Coming Soon", isLocked: true },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setStats(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hasData = stats && stats.totalSessions > 0;

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl w-full mb-16">
        {modules.map((module, index) => (
          <ModuleTile
            key={index}
            title={module.title}
            href={module.href}
            isActive={module.isActive}
            isLocked={module.isLocked}
          />
        ))}
      </div>

      {!loading && hasData && (
        <div className="flex flex-wrap justify-center items-end gap-12 max-w-3xl w-full text-center">
          <StatBlock
            label="Streak"
            value={stats.currentStreak}
            subtext="days"
          />
          <StatBlock
            label="Accuracy"
            value={`${stats.recentSnapshot.avgAccuracy}%`}
            subtext="last 7 days"
            progressPercent={stats.recentSnapshot.avgAccuracy}
          />
          <StatBlock
            label="Avg. Time"
            value={`${(stats.recentSnapshot.avgResponseTimeMs / 1000).toFixed(1)}s`}
            subtext="last 7 days"
          />
        </div>
      )}

      {!loading && !hasData && (
        <div className="text-center">
          <p className="text-sm text-[#737373]">
            Complete a session to start tracking progress
          </p>
        </div>
      )}
    </main>
  );
}
