"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/statistics", label: "Statistics" },
  { href: "/profile", label: "Profile" },
];

interface HeaderProps {
  isLoggedIn?: boolean;
  minimal?: boolean;
}

export function Header({ isLoggedIn = false, minimal = false }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border-subtle bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="font-mono text-sm font-medium tracking-tight text-foreground-muted transition-colors hover:text-foreground-bright"
          >
            quant prep
          </Link>

          {isLoggedIn && !minimal && (
            <nav className="hidden items-center gap-6 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm transition-colors",
                    pathname === item.href
                      ? "text-foreground-bright"
                      : "text-foreground-muted hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <button className="text-sm text-foreground-muted transition-colors hover:text-foreground">
              Sign out
            </button>
          ) : (
            <>
              <Link
                href="/signin"
                className="text-sm text-foreground-muted transition-colors hover:text-foreground"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="text-sm text-foreground-muted transition-colors hover:text-foreground"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
