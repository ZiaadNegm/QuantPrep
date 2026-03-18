"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Primary action area */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-gray-600">
            Welcome back to QuantPrep
          </p>
        </div>
        <Link
          href="/mental-math"
          className="rounded bg-black px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          Start Session
        </Link>
      </div>

      {/* Quick stats */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded border p-6">
              <div className="h-4 w-20 rounded bg-gray-200" />
              <div className="mt-3 h-8 w-12 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded border p-6">
            <p className="text-sm text-gray-500">Current Streak</p>
            <p className="mt-1 text-3xl font-bold">
              {stats?.currentStreak ?? 0}
              <span className="ml-1 text-base font-normal text-gray-400">days</span>
            </p>
          </div>
          <div className="rounded border p-6">
            <p className="text-sm text-gray-500">Sessions Completed</p>
            <p className="mt-1 text-3xl font-bold">{stats?.totalSessions ?? 0}</p>
          </div>
          <div className="rounded border p-6">
            <p className="text-sm text-gray-500">Questions Answered</p>
            <p className="mt-1 text-3xl font-bold">{stats?.totalQuestionsAnswered ?? 0}</p>
          </div>
        </div>
      )}

      {/* Module widgets */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Modules</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Mental Math - Active */}
          <div className="rounded-lg border-2 border-gray-200 p-5">
            <h3 className="font-semibold">Mental Math</h3>
            <p className="mt-1 text-sm text-gray-500">
              Practice arithmetic to sharpen your quantitative skills.
            </p>
            <div className="mt-4 flex gap-2">
              <Link
                href="/mental-math/practice"
                className="rounded bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
              >
                Practice
              </Link>
              <Link
                href="/mental-math/test"
                className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
              >
                Test
              </Link>
            </div>
          </div>

          {/* Coming Soon modules */}
          {["Probability", "Brainteasers", "Sequences"].map((name) => (
            <div key={name} className="rounded-lg border border-dashed border-gray-200 p-5 opacity-50">
              <h3 className="font-semibold text-gray-400">{name}</h3>
              <p className="mt-1 text-sm text-gray-400">Coming Soon</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent 7-day snapshot */}
      {!loading && hasData && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Last 7 Days</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded border p-5">
              <p className="text-sm text-gray-500">Avg Accuracy</p>
              <p className="mt-1 text-2xl font-bold">
                {stats.recentSnapshot.avgAccuracy}%
              </p>
            </div>
            <div className="rounded border p-5">
              <p className="text-sm text-gray-500">Avg Response Time</p>
              <p className="mt-1 text-2xl font-bold">
                {(stats.recentSnapshot.avgResponseTimeMs / 1000).toFixed(1)}s
              </p>
            </div>
            <div className="rounded border p-5">
              <p className="text-sm text-gray-500">Within Target</p>
              <p className="mt-1 text-2xl font-bold">
                {stats.recentSnapshot.percentWithinTarget}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !hasData && (
        <div className="rounded-lg border-2 border-dashed border-gray-200 p-10 text-center">
          <p className="text-lg font-medium text-gray-600">
            Start your first Mental Math session
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Complete a session to see your performance stats here.
          </p>
          <Link
            href="/mental-math"
            className="mt-4 inline-block rounded bg-black px-6 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Get Started
          </Link>
        </div>
      )}
    </div>
  );
}
