"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import InstallBanner from "@/components/install-banner";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/statistics", label: "Statistics" },
  { href: "/mistakes", label: "Mistakes" },
  { href: "/profile", label: "Profile" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border-subtle bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link
              href="/dashboard"
              className="font-mono text-sm font-medium tracking-tight text-foreground-muted transition-colors hover:text-foreground-bright"
            >
              quant prep
            </Link>

            <nav className="hidden items-center gap-6 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm transition-colors",
                    pathname === item.href || pathname.startsWith(item.href + "/")
                      ? "text-foreground-bright"
                      : "text-foreground-muted hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <button
            onClick={handleSignOut}
            className="text-sm text-foreground-muted transition-colors hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </header>

      <InstallBanner />
      <main className="flex flex-1 flex-col pt-12">{children}</main>
    </div>
  );
}
