import Link from "next/link";
import { Header } from "@/components/header";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header isLoggedIn={false} minimal />

      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <h1 className="mb-8 text-center text-lg font-medium text-foreground-bright">
            Create your account
          </h1>

          <form className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm text-foreground-muted"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
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
                className="w-full rounded-md border border-border bg-background-elevated px-4 py-2.5 text-foreground outline-none transition-colors placeholder:text-foreground-muted/50 focus:border-foreground-muted"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-md border border-foreground-muted bg-background-card py-2.5 font-medium text-foreground-bright transition-all hover:bg-background-hover"
            >
              Create account
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-foreground-muted">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="text-foreground transition-colors hover:text-foreground-bright"
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
