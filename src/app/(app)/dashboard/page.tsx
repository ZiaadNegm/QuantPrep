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
    <div className="flex flex-1 flex-col items-center px-8 pt-4 pb-8">
      {/* Module Matrix — Full viewport immersive display */}
      <section className="flex w-full max-w-7xl flex-col items-center justify-center">
        <div className="grid w-full grid-cols-3 gap-5">
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

        {/* Progress Context */}
        {!loading && (
          <div className="mt-12 w-full border-t border-border-subtle pt-8">
            {hasData ? (
              <div className="flex justify-between">
                <StatBlock
                  label="Streak"
                  value={stats.currentStreak}
                  subtext="days"
                />
                <StatBlock
                  label="Accuracy"
                  value={`${stats.recentSnapshot.avgAccuracy}%`}
                  subtext="last 7 days"
                />
                <StatBlock
                  label="Avg. Time"
                  value={`${(stats.recentSnapshot.avgResponseTimeMs / 1000).toFixed(1)}s`}
                  subtext="last 7 days"
                />
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-foreground-muted">
                  Complete a session to start tracking progress
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
