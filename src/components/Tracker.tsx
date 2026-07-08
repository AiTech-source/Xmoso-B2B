"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { trackPageView } from "@/lib/tracking/pageViewTracker";

export default function Tracker({ locale }: { locale: string }) {
  const pathname = usePathname();
  useEffect(() => {
    try {
      if (pathname.startsWith("/admin")) return;
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
      const supabase = createClient();
      if (!supabase) return;
      trackPageView(supabase, locale, pathname);
    } catch (_) {}
  }, [pathname, locale]);
  return null;
}
