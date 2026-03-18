"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import InstallBanner from "@/components/install-banner";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/mental-math", label: "Mental Math" },
  { href: "/statistics", label: "Statistics" },
  { href: "/mistakes", label: "Mistakes" },
  { href: "/profile", label: "Profile" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <nav className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold">QuantPrep</span>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm text-gray-600 hover:text-black"
        >
          Sign out
        </button>
      </nav>
      <InstallBanner />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
