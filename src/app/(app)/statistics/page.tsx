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
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

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
  const [granularity, setGranularity] = useState<"day" | "session">("day");
  const [loading, setLoading] = useState(true);
  const [breakdownLoading, setBreakdownLoading] = useState(true);

  function formatChartDate(val: string) {
    if (granularity === "session") {
      const d = new Date(val);
      return `${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    }
    return val.slice(5);
  }

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stats?granularity=${granularity}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setStats(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [granularity]);

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
      <div className="px-6 pt-8 pb-8">
        <div className="mx-auto w-full max-w-5xl">
          <h1 className="mb-6 text-3xl font-semibold text-white">Statistics</h1>
          <div className="grid gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-[#333] bg-[#1a1a1a] p-6">
                <div className="h-4 w-20 rounded bg-[#222]" />
                <div className="mt-3 h-8 w-12 rounded bg-[#222]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="px-6 pt-8 pb-8">
        <div className="mx-auto w-full max-w-5xl">
          <h1 className="mb-6 text-3xl font-semibold text-white">Statistics</h1>
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-4">
              {["Sessions", "Questions", "Streak", "Within Target"].map((label) => (
                <div key={label} className="rounded-xl border border-[#333] bg-[#1a1a1a] p-6 flex flex-col items-center justify-center">
                  <span className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider mb-2">{label}</span>
                  <span className="text-4xl font-bold text-white">--</span>
                </div>
              ))}
            </div>

            {["Accuracy Over Time", "Response Time Over Time", "Performance Breakdown"].map((title) => (
              <div key={title} className="rounded-xl border border-[#333] bg-[#1a1a1a] p-6">
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#a3a3a3]">{title}</h2>
                <div className="flex h-48 items-center justify-center rounded-xl border border-[#333] bg-[#171717]">
                  <div className="text-center">
                    <p className="text-sm text-[#737373]">
                      Complete a session to start tracking progress
                    </p>
                    <Link
                      href="/mental-math"
                      className="mt-2 inline-block text-sm font-medium text-white underline hover:no-underline"
                    >
                      Start a session
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const responseTimeChartData = stats.responseTimeOverTime.map((d) => ({
    date: d.date,
    avgSeconds: +(d.avgResponseTimeMs / 1000).toFixed(1),
  }));

  return (
    <div className="px-6 pt-8 pb-8">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-white">Statistics</h1>
          <div className="flex rounded-xl border border-[#333] bg-[#1a1a1a] p-1 text-sm">
            {(
              [
                { key: "day", label: "Day" },
                { key: "session", label: "Week" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setGranularity(key)}
                className={cn(
                  "rounded-md px-4 py-1.5 font-medium transition",
                  granularity === key
                    ? "bg-white text-black"
                    : "text-[#a3a3a3] hover:text-white"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-[#333] bg-[#1a1a1a] p-6 flex flex-col items-center justify-center">
            <span className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider mb-2">Sessions Completed</span>
            <span className="text-4xl font-bold text-white">{stats.totalSessions}</span>
          </div>
          <div className="rounded-xl border border-[#333] bg-[#1a1a1a] p-6 flex flex-col items-center justify-center">
            <span className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider mb-2">Questions Answered</span>
            <span className="text-4xl font-bold text-white">{stats.totalQuestionsAnswered}</span>
          </div>
          <div className="rounded-xl border border-[#333] bg-[#1a1a1a] p-6 flex flex-col items-center justify-center">
            <span className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider mb-2">Current Streak</span>
            <span className="text-4xl font-bold text-white">{stats.currentStreak}</span>
          </div>
          <div className="rounded-xl border border-[#333] bg-[#1a1a1a] p-6 flex flex-col items-center justify-center">
            <span className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider mb-2">Within Target</span>
            <span className="text-4xl font-bold text-white">{stats.recentSnapshot.percentWithinTarget}%</span>
          </div>
        </div>

        {/* Charts side-by-side */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-[#333] bg-[#1a1a1a] p-6">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#a3a3a3]">Accuracy Over Time</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={stats.accuracyOverTime}>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#737373", fontSize: 10 }}
                  tickFormatter={(val: string) => formatChartDate(val)}
                />
                <YAxis
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#737373", fontSize: 10 }}
                  tickFormatter={(val: number) => `${val}%`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "12px", fontSize: "12px" }}
                  labelStyle={{ color: "#a3a3a3" }}
                  itemStyle={{ color: "#e5e5e5" }}
                  formatter={(value) => [`${value}%`, "Accuracy"]}
                  labelFormatter={(label) => `${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#a3a3a3"
                  strokeWidth={1.5}
                  dot={{ fill: "#a3a3a3", r: 2 }}
                  activeDot={{ fill: "#e5e5e5", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-[#333] bg-[#1a1a1a] p-6">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#a3a3a3]">Average Response Time</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={responseTimeChartData}>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#737373", fontSize: 10 }}
                  tickFormatter={(val: string) => formatChartDate(val)}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#737373", fontSize: 10 }}
                  tickFormatter={(val: number) => `${val}s`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "12px", fontSize: "12px" }}
                  labelStyle={{ color: "#a3a3a3" }}
                  itemStyle={{ color: "#e5e5e5" }}
                  formatter={(value) => [`${value}s`, "Avg Response Time"]}
                  labelFormatter={(label) => `${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="avgSeconds"
                  stroke="#a3a3a3"
                  strokeWidth={1.5}
                  dot={{ fill: "#a3a3a3", r: 2 }}
                  activeDot={{ fill: "#e5e5e5", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Breakdown */}
        <div className="rounded-xl border border-[#333] bg-[#1a1a1a] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#a3a3a3]">Performance Breakdown</h2>
            <div className="rounded-xl border border-[#333] bg-[#0a0a0a] p-1">
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
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-medium transition",
                    groupBy === key
                      ? "bg-white text-black"
                      : "text-[#a3a3a3] hover:text-white"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {breakdownLoading ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-sm text-[#737373]">Loading...</p>
            </div>
          ) : breakdown.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-xl border border-[#333] bg-[#171717]">
              <p className="text-sm text-[#737373]">No data for this breakdown</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={breakdown} layout="vertical">
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#737373", fontSize: 10 }}
                  tickFormatter={(val: number) => `${val}%`}
                />
                <YAxis
                  type="category"
                  dataKey="group"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#737373", fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "12px", fontSize: "12px" }}
                  labelStyle={{ color: "#a3a3a3" }}
                  itemStyle={{ color: "#e5e5e5" }}
                  formatter={(value, name) => {
                    const v = Number(value);
                    if (name === "accuracy") return [`${v}%`, "Accuracy"];
                    return [`${(v / 1000).toFixed(1)}s`, "Avg Response Time"];
                  }}
                />
                <Bar dataKey="accuracy" fill="#8c8c8e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
