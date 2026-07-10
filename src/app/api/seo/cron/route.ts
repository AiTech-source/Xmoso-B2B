/**
 * GET /api/seo/cron
 *
 * Called by Vercel Cron Jobs daily at 9:00 AM UTC.
 * Generates content automatically based on the day of week:
 *   Mon → FAQ (Wine Coolers)
 *   Tue → Blog (2 articles)
 *   Wed → Insight (1 engineering article)
 *   Thu → (skip - review day)
 *   Fri → Blog + Blog
 *   Sat/Sun → (skip)
 *
 * Secured by CRON_SECRET env var.
 */
import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.ADMIN_API_KEY || "";
const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://xmoso.com";

const SCHEDULE: Record<number, { label: string; requests: { path: string; body: Record<string, string> }[] }> = {
  1: {
    label: "Monday - FAQ",
    requests: [
      { path: "/api/seo/generate-faqs", body: { product_type: "Wine Coolers", locale: "en" } },
    ],
  },
  2: {
    label: "Tuesday - Blog x2",
    requests: [
      { path: "/api/seo/generate-blog", body: { keyword: "wine cooler OEM supplier quality control checklist", slug: "wine-cooler-oem-quality-control", locale: "en" } },
      { path: "/api/seo/generate-blog", body: { keyword: "how to import wine coolers from China", slug: "import-wine-coolers-china-guide", locale: "en" } },
    ],
  },
  3: {
    label: "Wednesday - Insight",
    requests: [
      { path: "/api/seo/generate", body: { keyword: "wine cooler refrigeration system design engineer analysis", slug: "wine-cooler-refrigeration-system-design" } },
    ],
  },
  4: {
    label: "Thursday - review day (skip auto)",
    requests: [],
  },
  5: {
    label: "Friday - Blog x2",
    requests: [
      { path: "/api/seo/generate-blog", body: { keyword: "wine cooler energy efficiency standards CE ERP comparison", slug: "wine-cooler-energy-efficiency-standards", locale: "en" } },
      { path: "/api/seo/generate-blog", body: { keyword: "bulk wine fridge wholesale purchasing tips", slug: "bulk-wine-fridge-wholesale-tips", locale: "en" } },
    ],
  },
};

export async function GET(req: NextRequest) {
  // Auth check
  const secret = req.nextUrl.searchParams.get("secret") || req.headers.get("x-cron-secret") || "";
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const day = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const today = SCHEDULE[day];

  if (!today || today.requests.length === 0) {
    return NextResponse.json({ message: `No tasks scheduled for day ${day} (${today?.label || "weekend"})` });
  }

  const results: any[] = [];

  for (const req of today.requests) {
    try {
      const resp = await fetch(`${BASE}${req.path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify(req.body),
      });
      const data = await resp.json();
      results.push({ path: req.path, status: resp.status, data });
    } catch (e: any) {
      results.push({ path: req.path, error: e.message });
    }
  }

  return NextResponse.json({
    day,
    schedule: today.label,
    results,
  });
}
