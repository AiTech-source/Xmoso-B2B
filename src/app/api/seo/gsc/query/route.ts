import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const days = parseInt(req.nextUrl.searchParams.get("days") || "28");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "25");

  // Get refresh token from Supabase
  let refreshToken = "";
  try {
    const suUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const suKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!suUrl || !suKey) return NextResponse.json({ error: "SUPABASE env missing" }, { status: 500 });
    const rtRes = await fetch(`${suUrl}/rest/v1/site_settings?key=eq.gsc_refresh_token&select=value`, {
      headers: { apikey: suKey, Authorization: `Bearer ${suKey}` },
    });
    const rtData = await rtRes.json();
    refreshToken = rtData?.[0]?.value || "";
  } catch (e: any) {
    return NextResponse.json({ error: "fetch refresh token: " + e.message }, { status: 500 });
  }
  if (!refreshToken) return NextResponse.json({ error: "No GSC refresh token" }, { status: 400 });

  // Exchange for access token
  let accessToken = "";
  try {
    const cid = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const cs = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    if (!cid || !cs) return NextResponse.json({ error: "OAuth env missing" }, { status: 500 });
    const oaRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ refresh_token: refreshToken, client_id: cid, client_secret: cs, grant_type: "refresh_token" }),
    });
    const oaData = await oaRes.json();
    if (!oaData.access_token) return NextResponse.json({ error: "OAuth: " + (oaData.error || "no token") }, { status: 502 });
    accessToken = oaData.access_token;
  } catch (e: any) {
    return NextResponse.json({ error: "oauth: " + e.message }, { status: 500 });
  }

  // Call GSC Search Analytics
  try {
    const now = new Date().toISOString().split("T")[0];
    const past = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
    const site = "sc_domain:xmoso.com";
    const gscRes = await fetch(`https://searchconsole.googleapis.com/v1/sites/${encodeURIComponent(site)}/searchAnalytics/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: past, endDate: now, dimensions: ["query"], rowLimit: limit }),
    });
    if (!gscRes.ok) {
      const err = await gscRes.text().catch(() => "");
      return NextResponse.json({ error: "GSC API: " + gscRes.status + " " + err.slice(0, 200) }, { status: 502 });
    }
    const gsc = await gscRes.json();
    const queries = (gsc.rows || []).map((r: any) => ({
      query: r.keys?.[0] || "", impressions: r.impressions || 0, clicks: r.clicks || 0, ctr: r.ctr || 0, position: Math.round((r.position || 0) * 10) / 10,
    }));
    const opportunities = queries.filter((q: any) => q.position >= 8 && q.position <= 20 && q.impressions >= 50)
      .sort((a: any, b: any) => (b.impressions / b.position) - (a.impressions / a.position)).slice(0, 10);
    return NextResponse.json({
      totalImpressions: queries.reduce((s: number, q: any) => s + q.impressions, 0),
      totalClicks: queries.reduce((s: number, q: any) => s + q.clicks, 0),
      queries, opportunities, refreshed_at: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: "gsc api: " + e.message }, { status: 500 });
  }
}
