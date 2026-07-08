import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client for server-side rendering of public pages.
 * Does NOT use cookies() — allows Next.js to statically generate these pages
 * at build time (SSG) and serve them instantly on first visit.
 *
 * Only use this in public-facing pages that don't need auth session info.
 * Admin pages should use createServerSupabaseClient() (with cookies) instead.
 */
export function createServerStaticClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null as any;
  return createClient(url, key);
}
