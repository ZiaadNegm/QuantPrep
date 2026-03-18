"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { StatBlock } from "@/components/stat-block";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

// Mock data for demonstration
const mockAccuracyData = [
  { date: "Mar 1", value: 78 },
  { date: "Mar 3", value: 82 },
  { date: "Mar 5", value: 79 },
  { date: "Mar 7", value: 85 },
  { date: "Mar 9", value: 88 },
  { date: "Mar 11", value: 86 },
  { date: "Mar 13", value: 91 },
  { date: "Mar 15", value: 89 },
  { date: "Mar 17", value: 94 },
];

const mockResponseTimeData = [
  { date: "Mar 1", value: 4.2 },
  { date: "Mar 3", value: 3.8 },
  { date: "Mar 5", value: 3.5 },
  { date: "Mar 7", value: 3.2 },
  { date: "Mar 9", value: 2.9 },
  { date: "Mar 11", value: 3.1 },
  { date: "Mar 13", value: 2.7 },
  { date: "Mar 15", value: 2.5 },
  { date: "Mar 17", value: 2.3 },
];

const mockBreakdownByLevel = [
  { name: "L1", accuracy: 98 },
  { name: "L2", accuracy: 94 },
  { name: "L3", accuracy: 87 },
  { name: "L4", accuracy: 78 },
  { name: "L5", accuracy: 65 },
];

const mockBreakdownByOperation = [
  { name: "+", accuracy: 96 },
  { name: "-", accuracy: 92 },
  { name: "x", accuracy: 88 },
  { name: "/", accuracy: 82 },
];

const mockBreakdownByType = [
  { name: "Integer", accuracy: 94 },
  { name: "Decimal", accuracy: 86 },
  { name: "Fraction", accuracy: 78 },
  { name: "Mixed", accuracy: 72 },
];

const mockSessionHistory = [
  {
    id: 1,
    date: "Mar 17",
    mode: "Practice",
    score: 47,
    accuracy: 94,
    avgTime: "2.3s",
    levels: "L1, L2",
  },
  {
    id: 2,
    date: "Mar 16",
    mode: "Optiver 80 in 8",
    score: 68,
    accuracy: 89,
    avgTime: "5.1s",
    levels: "L3, L4",
  },
  {
    id: 3,
    date: "Mar 15",
    mode: "Practice",
    score: 38,
    accuracy: 95,
    avgTime: "1.9s",
    levels: "L1",
  },
  {
    id: 4,
    date: "Mar 14",
    mode: "Mixed Sprint 40",
    score: 32,
    accuracy: 87,
    avgTime: "4.2s",
    levels: "L2, L3",
  },
  {
    id: 5,
    date: "Mar 13",
    mode: "Practice",
    score: 19,
    accuracy: 95,
    avgTime: "2.1s",
    levels: "L1",
  },
];

type TimeRange = "7d" | "30d" | "3m" | "all";
type BreakdownType = "level" | "operation" | "type";

export default function StatisticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [breakdownType, setBreakdownType] = useState<BreakdownType>("level");

  // Simulate having data
  const hasData = true;

  const breakdownData =
    breakdownType === "level"
      ? mockBreakdownByLevel
      : breakdownType === "operation"
      ? mockBreakdownByOperation
      : mockBreakdownByType;

  return (
    <div className="min-h-screen bg-background">
      <Header isLoggedIn={true} />

      <main className="mx-auto max-w-5xl px-6 pb-16 pt-20">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-lg font-medium text-foreground-bright">
            Statistics
          </h1>

          {/* Time Range Filter */}
          <div className="flex rounded-lg border border-border bg-background-elevated p-1">
            {(["7d", "30d", "3m", "all"] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-all",
                  timeRange === range
                    ? "bg-background-card text-foreground-bright"
                    : "text-foreground-muted hover:text-foreground"
                )}
              >
                {range === "7d"
                  ? "7 days"
                  : range === "30d"
                  ? "30 days"
                  : range === "3m"
                  ? "3 months"
                  : "All time"}
              </button>
            ))}
          </div>
        </div>

        {hasData ? (
          <>
            {/* Top Summary */}
            <section className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg border border-border-subtle bg-background-elevated p-4">
                <StatBlock label="Sessions" value="24" />
              </div>
              <div className="rounded-lg border border-border-subtle bg-background-elevated p-4">
                <StatBlock label="Questions" value="1,247" />
              </div>
              <div className="rounded-lg border border-border-subtle bg-background-elevated p-4">
                <StatBlock label="Streak" value="7 days" />
              </div>
              <div className="rounded-lg border border-border-subtle bg-background-elevated p-4">
                <StatBlock label="Within Target" value="78%" />
              </div>
            </section>

            {/* Charts Grid */}
            <section className="mb-10 grid gap-6 lg:grid-cols-2">
              {/* Accuracy Over Time */}
              <div className="rounded-lg border border-border-subtle bg-background-elevated p-6">
                <h3 className="mb-4 text-xs uppercase tracking-wider text-foreground-muted">
                  Accuracy Over Time
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockAccuracyData}>
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#666666", fontSize: 10 }}
                      />
                      <YAxis
                        domain={[60, 100]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#666666", fontSize: 10 }}
                        width={30}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1a1a1a",
                          border: "1px solid #2a2a2a",
                          borderRadius: "6px",
                          fontSize: "12px",
                        }}
                        labelStyle={{ color: "#a3a3a3" }}
                        itemStyle={{ color: "#e5e5e5" }}
                        formatter={(value: number) => [`${value}%`, "Accuracy"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#666666"
                        strokeWidth={1.5}
                        dot={{ fill: "#666666", r: 2 }}
                        activeDot={{ fill: "#e5e5e5", r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Response Time Over Time */}
              <div className="rounded-lg border border-border-subtle bg-background-elevated p-6">
                <h3 className="mb-4 text-xs uppercase tracking-wider text-foreground-muted">
                  Avg. Response Time
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockResponseTimeData}>
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#666666", fontSize: 10 }}
                      />
                      <YAxis
                        domain={[0, 5]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#666666", fontSize: 10 }}
                        width={30}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1a1a1a",
                          border: "1px solid #2a2a2a",
                          borderRadius: "6px",
                          fontSize: "12px",
                        }}
                        labelStyle={{ color: "#a3a3a3" }}
                        itemStyle={{ color: "#e5e5e5" }}
                        formatter={(value: number) => [`${value}s`, "Time"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#666666"
                        strokeWidth={1.5}
                        dot={{ fill: "#666666", r: 2 }}
                        activeDot={{ fill: "#e5e5e5", r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            {/* Performance Breakdown */}
            <section className="mb-10 rounded-lg border border-border-subtle bg-background-elevated p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-wider text-foreground-muted">
                  Performance Breakdown
                </h3>
                <div className="flex rounded-md border border-border bg-background-card p-0.5">
                  {(["level", "operation", "type"] as BreakdownType[]).map(
                    (type) => (
                      <button
                        key={type}
                        onClick={() => setBreakdownType(type)}
                        className={cn(
                          "rounded px-3 py-1 text-xs transition-all",
                          breakdownType === type
                            ? "bg-background-hover text-foreground-bright"
                            : "text-foreground-muted hover:text-foreground"
                        )}
                      >
                        {type === "level"
                          ? "By Level"
                          : type === "operation"
                          ? "By Operation"
                          : "By Type"}
                      </button>
                    )
                  )}
                </div>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={breakdownData} layout="vertical">
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#666666", fontSize: 10 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#a3a3a3", fontSize: 12 }}
                      width={60}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a1a",
                        border: "1px solid #2a2a2a",
                        borderRadius: "6px",
                        fontSize: "12px",
                      }}
                      labelStyle={{ color: "#a3a3a3" }}
                      itemStyle={{ color: "#e5e5e5" }}
                      formatter={(value: number) => [`${value}%`, "Accuracy"]}
                    />
                    <Bar
                      dataKey="accuracy"
                      fill="#3d3d3d"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Session History */}
            <section className="rounded-lg border border-border-subtle bg-background-elevated p-6">
              <h3 className="mb-4 text-xs uppercase tracking-wider text-foreground-muted">
                Recent Sessions
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wider text-foreground-muted">
                      <th className="pb-3 pr-4">Date</th>
                      <th className="pb-3 pr-4">Mode</th>
                      <th className="pb-3 pr-4 text-right">Score</th>
                      <th className="pb-3 pr-4 text-right">Accuracy</th>
                      <th className="pb-3 pr-4 text-right">Avg. Time</th>
                      <th className="pb-3 text-right">Levels</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {mockSessionHistory.map((session) => (
                      <tr
                        key={session.id}
                        className="border-b border-border-subtle/50 last:border-0"
                      >
                        <td className="py-3 pr-4 text-foreground-muted">
                          {session.date}
                        </td>
                        <td className="py-3 pr-4 text-foreground">
                          {session.mode}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono text-foreground-bright">
                          {session.score}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono text-foreground">
                          {session.accuracy}%
                        </td>
                        <td className="py-3 pr-4 text-right font-mono text-foreground-muted">
                          {session.avgTime}
                        </td>
                        <td className="py-3 text-right font-mono text-foreground-muted">
                          {session.levels}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-24">
            {/* Empty chart shells */}
            <div className="mb-8 grid w-full max-w-2xl gap-6 sm:grid-cols-2">
              <div className="h-40 rounded-lg border border-border-subtle bg-background-elevated" />
              <div className="h-40 rounded-lg border border-border-subtle bg-background-elevated" />
            </div>
            <p className="mb-6 text-center text-foreground-muted">
              Complete a session to start tracking progress
            </p>
            <Link
              href="/mental-math"
              className="rounded-lg border border-foreground-muted bg-background-card px-6 py-2.5 text-sm font-medium text-foreground-bright transition-all hover:bg-background-hover"
            >
              Start Your First Session
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
