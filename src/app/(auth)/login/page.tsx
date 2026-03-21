"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="mb-8 text-center text-lg font-medium text-foreground-bright">
        Sign in to Quant Prep
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
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
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-foreground-muted">
        {"Don't have an account? "}
        <Link
          href="/signup"
          className="text-foreground transition-colors hover:text-foreground-bright"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
