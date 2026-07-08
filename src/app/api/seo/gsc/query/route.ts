import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Step 1: Check env vars
    const cid = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const cs = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    const suUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const suKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!cid) return NextResponse.json({ error: "GOOGLE_OAUTH_CLIENT_ID not set" }, { status: 500 });
    if (!cs) return NextResponse.json({ error: "GOOGLE_OAUTH_CLIENT_SECRET not set" }, { status: 500 });
    if (!suUrl) return NextResponse.json({ error: "NEXT_PUBLIC_SUPABASE_URL not set" }, { status: 500 });
    if (!suKey) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not set" }, { status: 500 });

    // Step 2: Get refresh token from Supabase
    const rtUrl = `${suUrl}/rest/v1/site_settings?key=eq.gsc_refresh_token&select=value`;
    const rtRes = await fetch(rtUrl, {
      headers: { apikey: suKey, Authorization: `Bearer ${suKey}`, "Content-Type": "application/json" },
    });
    if (!rtRes.ok) return NextResponse.json({ error: `Supabase REST error: ${rtRes.status}` }, { status: 502 });
    const rtData = await rtRes.json();
    const refreshToken = rtData?.[0]?.value;
    if (!refreshToken) return NextResponse.json({ error: "No GSC refresh token. Visit /api/seo/gsc/auth" }, { status: 400 });

    // Step 3: Get access token via OAuth
    const days = parseInt(req.nextUrl.searchParams.get("days") || "28");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "25");
    const oaRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ refresh_token: refreshToken, client_id: cid, client_secret: cs, grant_type: "refresh_token" }),
    });
    const oaData = await oaRes.json();
    if (!oaData.access_token) return NextResponse.json({ error: `OAuth error: ${oaData.error || "unknown"}` }, { status: 502 });

    // Step 4: Fetch GSC data
    const now = new Date().toISOString().split("T")[0];
    const past = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
    const site = encodeURIComponent("sc_domain:xmoso.com");
    const gscRes = await fetch(`https://searchconsole.googleapis.com/v1/sites/${site}/searchAnalytics/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${oaData.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: past, endDate: now, dimensions: ["query"], rowLimit: limit }),
    });
    if (!gscRes.ok) return NextResponse.json({ error: `GSC API error (${gscRes.status})` }, { status: 502 });

    const gsc = await gscRes.json();
    const queries = (gsc.rows || []).map((r: any) => ({
      query: r.keys?.[0] || "", impressions: r.impressions || 0, clicks: r.clicks || 0,
      ctr: r.ctr || 0, position: Math.round((r.position || 0) * 10) / 10,
    }));
    const opportunities = queries
      .filter((q: any) => q.position >= 8 && q.position <= 20 && q.impressions >= 50)
      .sort((a: any, b: any) => (b.impressions / b.position) - (a.impressions / a.position))
      .slice(0, 10);

    return NextResponse.json({
      totalImpressions: queries.reduce((s: number, q: any) => s + q.impressions, 0),
      totalClicks: queries.reduce((s: number, q: any) => s + q.clicks, 0),
      queries, opportunities, refreshed_at: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}
