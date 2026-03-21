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
      <header
        className="border-b border-[#333] backdrop-blur-md sticky top-0 z-50 py-4 px-6 md:px-12 items-center grid grid-cols-3"
        style={{ backgroundColor: "#1a1a1a" }}
      >
        <div className="flex items-center">
          <Link
            href="/dashboard"
            className="text-xl font-semibold tracking-tight text-white"
          >
            Quant Prep
          </Link>
        </div>

        <nav className="hidden md:flex items-center justify-center space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors",
                pathname === item.href || pathname.startsWith(item.href + "/")
                  ? "text-white"
                  : "text-[#a3a3a3] hover:text-white"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={handleSignOut}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-[#404040] bg-transparent hover:bg-[#262626] text-[#d4d4d4] hover:text-white h-9 px-4 py-2 justify-self-end cursor-pointer"
        >
          Sign Out
        </button>
      </header>

      <InstallBanner />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
