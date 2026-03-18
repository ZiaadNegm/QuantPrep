"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Stats {
  totalSessions: number;
  totalQuestionsAnswered: number;
  currentStreak: number;
  recentSnapshot: {
    avgAccuracy: number;
    avgResponseTimeMs: number;
    percentWithinTarget: number;
  };
  accuracyOverTime: { date: string; accuracy: number }[];
  responseTimeOverTime: { date: string; avgResponseTimeMs: number }[];
}

interface BreakdownItem {
  group: string;
  total: number;
  correct: number;
  accuracy: number;
  avgResponseTimeMs: number;
}

type GroupBy = "level" | "operation" | "number_type";

export default function StatisticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [breakdown, setBreakdown] = useState<BreakdownItem[]>([]);
  const [groupBy, setGroupBy] = useState<GroupBy>("level");
  const [loading, setLoading] = useState(true);
  const [breakdownLoading, setBreakdownLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setStats(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setBreakdownLoading(true);
    fetch(`/api/stats/breakdown?groupBy=${groupBy}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setBreakdown(data.breakdown ?? []);
      })
      .catch(() => {})
      .finally(() => setBreakdownLoading(false));
  }, [groupBy]);

  const hasData = stats && stats.totalSessions > 0;

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-3xl font-bold">Statistics</h1>
        <div className="grid gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse rounded border p-5">
              <div className="h-4 w-20 rounded bg-gray-200" />
              <div className="mt-3 h-8 w-12 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-3xl font-bold">Statistics</h1>
        <div className="space-y-6">
          {/* Empty summary cards */}
          <div className="grid gap-4 sm:grid-cols-4">
            {["Sessions", "Questions", "Streak", "Within Target"].map((label) => (
              <div key={label} className="rounded border p-5">
                <p className="text-sm text-gray-500">{label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-300">--</p>
              </div>
            ))}
          </div>

          {/* Empty chart placeholders */}
          {["Accuracy Over Time", "Response Time Over Time", "Performance Breakdown"].map((title) => (
            <div key={title} className="rounded border p-6">
              <h2 className="mb-4 text-lg font-semibold">{title}</h2>
              <div className="flex h-48 items-center justify-center rounded bg-gray-50">
                <div className="text-center">
                  <p className="text-sm text-gray-400">
                    Complete a session to start tracking progress
                  </p>
                  <Link
                    href="/mental-math"
                    className="mt-2 inline-block text-sm font-medium text-black underline hover:no-underline"
                  >
                    Start a session
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const responseTimeChartData = stats.responseTimeOverTime.map((d) => ({
    date: d.date,
    avgSeconds: +(d.avgResponseTimeMs / 1000).toFixed(1),
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <h1 className="text-3xl font-bold">Statistics</h1>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded border p-5">
          <p className="text-sm text-gray-500">Sessions Completed</p>
          <p className="mt-1 text-2xl font-bold">{stats.totalSessions}</p>
        </div>
        <div className="rounded border p-5">
          <p className="text-sm text-gray-500">Questions Answered</p>
          <p className="mt-1 text-2xl font-bold">{stats.totalQuestionsAnswered}</p>
        </div>
        <div className="rounded border p-5">
          <p className="text-sm text-gray-500">Current Streak</p>
          <p className="mt-1 text-2xl font-bold">
            {stats.currentStreak}
            <span className="ml-1 text-sm font-normal text-gray-400">days</span>
          </p>
        </div>
        <div className="rounded border p-5">
          <p className="text-sm text-gray-500">Within Target</p>
          <p className="mt-1 text-2xl font-bold">
            {stats.recentSnapshot.percentWithinTarget}%
          </p>
        </div>
      </div>

      {/* Accuracy Over Time */}
      <div className="rounded border p-6">
        <h2 className="mb-4 text-lg font-semibold">Accuracy Over Time</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={stats.accuracyOverTime}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(val: string) => val.slice(5)}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              tickFormatter={(val: number) => `${val}%`}
            />
            <Tooltip
              formatter={(value) => [`${value}%`, "Accuracy"]}
              labelFormatter={(label) => `${label}`}
            />
            <Line
              type="monotone"
              dataKey="accuracy"
              stroke="#000"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Response Time Over Time */}
      <div className="rounded border p-6">
        <h2 className="mb-4 text-lg font-semibold">Average Response Time Over Time</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={responseTimeChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(val: string) => val.slice(5)}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(val: number) => `${val}s`}
            />
            <Tooltip
              formatter={(value) => [`${value}s`, "Avg Response Time"]}
              labelFormatter={(label) => `${label}`}
            />
            <Line
              type="monotone"
              dataKey="avgSeconds"
              stroke="#000"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Breakdown */}
      <div className="rounded border p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Performance Breakdown</h2>
          <div className="flex gap-1 rounded border p-0.5">
            {(
              [
                { key: "level", label: "By Level" },
                { key: "operation", label: "By Operation" },
                { key: "number_type", label: "By Number Type" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setGroupBy(key)}
                className={`rounded px-3 py-1 text-xs font-medium transition ${
                  groupBy === key
                    ? "bg-black text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {breakdownLoading ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-sm text-gray-400">Loading...</p>
          </div>
        ) : breakdown.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded bg-gray-50">
            <p className="text-sm text-gray-400">No data for this breakdown</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={breakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="group" tick={{ fontSize: 12 }} />
              <YAxis
                yAxisId="accuracy"
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                tickFormatter={(val: number) => `${val}%`}
              />
              <YAxis
                yAxisId="time"
                orientation="right"
                tick={{ fontSize: 12 }}
                tickFormatter={(val: number) => `${(val / 1000).toFixed(1)}s`}
              />
              <Tooltip
                formatter={(value, name) => {
                  const v = Number(value);
                  if (name === "accuracy") return [`${v}%`, "Accuracy"];
                  return [`${(v / 1000).toFixed(1)}s`, "Avg Response Time"];
                }}
              />
              <Bar yAxisId="accuracy" dataKey="accuracy" fill="#000" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="time" dataKey="avgResponseTimeMs" fill="#d1d5db" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
