"use client";

import { Header } from "@/components/header";
import { StatBlock } from "@/components/stat-block";

export default function ProfilePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header isLoggedIn={true} />

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20">
        <div className="w-full max-w-2xl">
        {/* Page Header */}
        <h1 className="mb-8 text-lg font-medium text-foreground-bright">
          Profile
        </h1>

        {/* User Info */}
        <section className="mb-8 rounded-lg border border-border-subtle bg-background-elevated p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background-card font-mono text-xl text-foreground-muted">
              QP
            </div>
            <div>
              <h2 className="font-medium text-foreground-bright">
                Quant Prep User
              </h2>
              <p className="text-sm text-foreground-muted">
                user@quantprep.com
              </p>
            </div>
          </div>
        </section>

        {/* Summary Stats */}
        <section className="mb-8 rounded-lg border border-border-subtle bg-background-elevated p-6">
          <h3 className="mb-4 text-xs uppercase tracking-wider text-foreground-muted">
            All-Time Stats
          </h3>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <StatBlock label="Sessions" value="47" />
            <StatBlock label="Questions" value="2,341" />
            <StatBlock label="Best Streak" value="14" subtext="days" />
            <StatBlock label="Avg. Accuracy" value="91%" />
          </div>
        </section>

        {/* Settings */}
        <section className="rounded-lg border border-border-subtle bg-background-elevated p-6">
          <h3 className="mb-4 text-xs uppercase tracking-wider text-foreground-muted">
            Settings
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Sound Effects</p>
                <p className="text-xs text-foreground-muted">
                  Play sounds on correct/incorrect answers
                </p>
              </div>
              <button
                className="relative h-5 w-9 rounded-full bg-border transition-colors"
                role="switch"
                aria-checked={false}
              >
                <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-background-card transition-transform" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Show Keyboard Hints</p>
                <p className="text-xs text-foreground-muted">
                  Display keyboard shortcuts during sessions
                </p>
              </div>
              <button
                className="relative h-5 w-9 rounded-full bg-foreground-muted transition-colors"
                role="switch"
                aria-checked={true}
              >
                <span className="absolute left-4 top-0.5 h-4 w-4 rounded-full bg-background-card transition-transform" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Daily Reminders</p>
                <p className="text-xs text-foreground-muted">
                  Get notified to practice daily
                </p>
              </div>
              <button
                className="relative h-5 w-9 rounded-full bg-border transition-colors"
                role="switch"
                aria-checked={false}
              >
                <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-background-card transition-transform" />
              </button>
            </div>
          </div>
        </section>

        {/* Account Actions */}
        <section className="mt-8 flex justify-between">
          <button className="text-sm text-foreground-muted transition-colors hover:text-foreground">
            Sign out
          </button>
          <button className="text-sm text-error/70 transition-colors hover:text-error">
            Delete account
          </button>
        </section>
        </div>
      </main>
    </div>
  );
}
