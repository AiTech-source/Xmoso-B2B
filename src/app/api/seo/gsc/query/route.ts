const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET || "";
const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID || "";
/**
 * GET /api/seo/gsc/query
 * Fetches Search Console query analytics for xmoso.com
 * Uses stored refresh token, auto-refreshes access token
 *
 * Query params:
 *   days?=28  — lookback period
 *   limit?=25 — number of results
 *
 * Response: { queries: [{ query, impressions, clicks, ctr, position }], refreshed_at }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";


const SITE_URL = "sc_domain:xmoso.com";

async function getAccessToken(): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("DB env missing");
  const supabase = createClient(url, key);

  // Try stored access token first
  let { data: at } = await supabase.from("site_settings").select("value").eq("key", "gsc_access_token").single();
  let { data: rt } = await supabase.from("site_settings").select("value").eq("key", "gsc_refresh_token").single();
  let { data: exp } = await supabase.from("site_settings").select("value").eq("key", "gsc_token_expiry").single();

  // If access token still valid, use it
  if (at?.value && exp?.value && Date.now() < parseInt(exp.value)) {
    return at.value;
  }

  // Need to refresh
  if (!rt?.value) throw new Error("No refresh token. Visit /api/seo/gsc/auth to authorize.");

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: rt.value,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "refresh_token",
    }),
  });
  const data = await resp.json();
  if (!data.access_token) throw new Error(`Token refresh failed: ${JSON.stringify(data)}`);

  // Store new tokens
  const newExpiry = Date.now() + (data.expires_in || 3600) * 1000;
  await supabase.from("site_settings").upsert({ key: "gsc_access_token", value: data.access_token }, { onConflict: "key" });
  await supabase.from("site_settings").upsert({ key: "gsc_token_expiry", value: String(newExpiry) }, { onConflict: "key" });
  if (data.refresh_token) {
    await supabase.from("site_settings").upsert({ key: "gsc_refresh_token", value: data.refresh_token }, { onConflict: "key" });
  }

  return data.access_token;
}

export async function GET(req: NextRequest) {
  try {
    const days = parseInt(req.nextUrl.searchParams.get("days") || "28");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "25");
    const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0");

    const accessToken = await getAccessToken();

    // Build date range
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];

    // Fetch query analytics
    const resp = await fetch(
      `https://searchconsole.googleapis.com/v1/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate,
          endDate,
          dimensions: ["query"],
          rowLimit: limit,
          startRow: offset,
          orderBy: [{ fieldName: "impressions", sortOrder: "DESCENDING" }],
        }),
      }
    );

    if (!resp.ok) {
      const err = await resp.text();
      return NextResponse.json({ error: `GSC API error (${resp.status})`, details: err.slice(0, 500) }, { status: 502 });
    }

    const data = await resp.json();
    const rows = data.rows || [];

    const queries = rows.map((r: any) => ({
      query: r.keys?.[0] || "",
      impressions: r.impressions || 0,
      clicks: r.clicks || 0,
      ctr: r.ctr || 0,
      position: Math.round((r.position || 0) * 10) / 10,
    }));

    // Fetch page-level data for insights
    const pageResp = await fetch(
      `https://searchconsole.googleapis.com/v1/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate,
          endDate,
          dimensions: ["page"],
          rowLimit: 10,
          orderBy: [{ fieldName: "impressions", sortOrder: "DESCENDING" }],
        }),
      }
    );
    const pageData = await pageResp.json();
    const topPages = (pageData.rows || []).map((r: any) => ({
      page: r.keys?.[0] || "",
      impressions: r.impressions || 0,
      clicks: r.clicks || 0,
    }));

    // Calculate opportunities: queries ranking 8-20 with high impressions
    const opportunities = queries
      .filter((q: any) => q.position >= 8 && q.position <= 20 && q.impressions >= 50)
      .sort((a: any, b: any) => (b.impressions / b.position) - (a.impressions / a.position))
      .slice(0, 10);

    return NextResponse.json({
      site: SITE_URL,
      period: { startDate, endDate, days },
      totalImpressions: queries.reduce((s: number, q: any) => s + q.impressions, 0),
      totalClicks: queries.reduce((s: number, q: any) => s + q.clicks, 0),
      queries,
      topPages,
      opportunities,
      refreshed_at: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
