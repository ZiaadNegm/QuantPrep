"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="w-full max-w-sm text-center">
        <h1 className="mb-4 text-lg font-medium text-foreground-bright">
          Check your email
        </h1>
        <p className="text-sm text-foreground-muted">
          We sent you a confirmation link. Please check your email to complete
          signup.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block text-sm text-foreground transition-colors hover:text-foreground-bright"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="mb-8 text-center text-lg font-medium text-foreground-bright">
        Create your account
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="displayName"
            className="mb-2 block text-sm text-foreground-muted"
          >
            Display name
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className="w-full rounded-md border border-border bg-background-elevated px-4 py-2.5 text-foreground outline-none transition-colors placeholder:text-foreground-muted/50 focus:border-foreground-muted"
            placeholder="Your name"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm text-foreground-muted"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md border border-border bg-background-elevated px-4 py-2.5 text-foreground outline-none transition-colors placeholder:text-foreground-muted/50 focus:border-foreground-muted"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm text-foreground-muted"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-md border border-border bg-background-elevated px-4 py-2.5 text-foreground outline-none transition-colors placeholder:text-foreground-muted/50 focus:border-foreground-muted"
            placeholder="••••••••"
          />
        </div>
        {error && <p className="text-sm text-error">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md border border-foreground-muted bg-background-card py-2.5 font-medium text-foreground-bright transition-all hover:bg-background-hover disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-foreground-muted">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-foreground transition-colors hover:text-foreground-bright"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
