/**
 * GET /api/seo/gsc/query
 * Fetches Search Console query analytics for xmoso.com
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SITE_URL = "sc_domain:xmoso.com";

function getClients() {
  return {
    supabase: createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    ),
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || "",
  };
}

async function getAccessToken(): Promise<string> {
  const { supabase, clientId, clientSecret } = getClients();
  if (!clientId || !clientSecret) throw new Error("GSC OAuth not configured");

  const [{ data: at }, { data: rt }, { data: exp }] = await Promise.all([
    supabase.from("site_settings").select("value").eq("key", "gsc_access_token").maybeSingle(),
    supabase.from("site_settings").select("value").eq("key", "gsc_refresh_token").maybeSingle(),
    supabase.from("site_settings").select("value").eq("key", "gsc_token_expiry").maybeSingle(),
  ]);

  if (at?.value && exp?.value && Date.now() < parseInt(exp.value)) {
    return at.value;
  }
  if (!rt?.value) throw new Error("No refresh token. Visit /api/seo/gsc/auth to authorize.");

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: rt.value,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });
  const data = await resp.json();
  if (!data.access_token) throw new Error(`Token refresh failed: ${JSON.stringify(data)}`);

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
    const accessToken = await getAccessToken();
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];

    const resp = await fetch(
      `https://searchconsole.googleapis.com/v1/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate, dimensions: ["query"], rowLimit: limit, orderBy: [{ fieldName: "impressions", sortOrder: "DESCENDING" }] }),
      }
    );
    if (!resp.ok) return NextResponse.json({ error: `GSC API error (${resp.status})` }, { status: 502 });

    const data = await resp.json();
    const queries = (data.rows || []).map((r: any) => ({
      query: r.keys?.[0] || "",
      impressions: r.impressions || 0,
      clicks: r.clicks || 0,
      ctr: r.ctr || 0,
      position: Math.round((r.position || 0) * 10) / 10,
    }));

    const opportunities = queries
      .filter((q: any) => q.position >= 8 && q.position <= 20 && q.impressions >= 50)
      .sort((a: any, b: any) => (b.impressions / b.position) - (a.impressions / a.position))
      .slice(0, 10);

    return NextResponse.json({
      totalImpressions: queries.reduce((s: number, q: any) => s + q.impressions, 0),
      totalClicks: queries.reduce((s: number, q: any) => s + q.clicks, 0),
      queries, opportunities,
      refreshed_at: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
