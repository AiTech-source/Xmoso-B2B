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
import { createCronBacklogRequests } from "@/lib/seo/keyword-backlog";

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
    label: "Tuesday - Blog backlog x2",
    requests: createCronBacklogRequests(2, "en", 2),
  },
  3: {
    label: "Wednesday - Insight backlog",
    requests: createCronBacklogRequests(3, "en", 1),
  },
  4: {
    label: "Thursday - review day (skip auto)",
    requests: [],
  },
  5: {
    label: "Friday - Blog backlog x2",
    requests: createCronBacklogRequests(5, "en", 2),
  },
};

type CronResult =
  | { path: string; status: number; data: unknown }
  | { path: string; error: string };

export async function GET(req: NextRequest) {
  // Auth check
  const cronSecret = process.env.CRON_SECRET;
  const bearerToken = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const secret =
    bearerToken ||
    req.nextUrl.searchParams.get("secret") ||
    req.headers.get("x-cron-secret") ||
    "";

  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const day = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const today = SCHEDULE[day];

  if (!today || today.requests.length === 0) {
    return NextResponse.json({ message: `No tasks scheduled for day ${day} (${today?.label || "weekend"})` });
  }

  const results: CronResult[] = [];

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
    } catch (e: unknown) {
      results.push({ path: req.path, error: e instanceof Error ? e.message : "Unknown error" });
    }
  }

  return NextResponse.json({
    day,
    schedule: today.label,
    results,
  });
}
