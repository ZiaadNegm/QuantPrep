import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // Fallback to placeholder during SSR/prerender to avoid build crashes.
  // The real values are always available at runtime in the browser.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";
  return createBrowserClient(url, key);
}
