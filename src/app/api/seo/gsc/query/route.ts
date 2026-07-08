import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const step = (s: string, data?: any) => console.log(`[GSC] ${s}`, data || "");

  try {
    step("starting");
    const cid = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const cs = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    const suUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const suKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const days = parseInt(req.nextUrl.searchParams.get("days") || "28");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "25");

    if (!cid || !cs || !suUrl || !suKey) {
      return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
    }

    step("fetch refresh token");
    const rtRes = await fetch(`${suUrl}/rest/v1/site_settings?key=eq.gsc_refresh_token&select=value`, {
      headers: { apikey: suKey, Authorization: `Bearer ${suKey}` },
    });
    if (!rtRes.ok) return NextResponse.json({ error: `RT fetch: ${rtRes.status}` }, { status: 502 });
    const rtData = await rtRes.json();
    const refreshToken = rtData?.[0]?.value;
    if (!refreshToken) return NextResponse.json({ error: "No refresh token" }, { status: 400 });

    step("exchange for access token");
    const oaRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `refresh_token=${encodeURIComponent(refreshToken)}&client_id=${encodeURIComponent(cid)}&client_secret=${encodeURIComponent(cs)}&grant_type=refresh_token`,
    });
    const oaData = await oaRes.json();
    if (!oaData.access_token) return NextResponse.json({ error: `OAuth: ${oaData.error || "?"}`, detail: oaData }, { status: 502 });

    step("got access token, calling GSC");
    const site = encodeURIComponent("sc_domain:xmoso.com");
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];

    const gscRes = await fetch(`https://searchconsole.googleapis.com/v1/sites/${site}/searchAnalytics/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${oaData.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate, dimensions: ["query"], rowLimit: limit }),
    });
    if (!gscRes.ok) {
      const errText = await gscRes.text().catch(() => "unknown");
      return NextResponse.json({ error: `GSC ${gscRes.status}`, detail: errText.slice(0, 300) }, { status: 502 });
    }

    step("parsing GSC response");
    const gsc = await gscRes.json();
    const queries = (gsc.rows || []).map((r: any) => ({
      query: r.keys?.[0] || "", impressions: r.impressions || 0, clicks: r.clicks || 0,
      ctr: r.ctr || 0, position: Math.round((r.position || 0) * 10) / 10,
    }));
    const opportunities = queries
      .filter((q: any) => q.position >= 8 && q.position <= 20 && q.impressions >= 50)
      .sort((a: any, b: any) => (b.impressions / b.position) - (a.impressions / a.position))
      .slice(0, 10);

    step("returning success", { queries: queries.length });
    return NextResponse.json({
      totalImpressions: queries.reduce((s: number, q: any) => s + q.impressions, 0),
      totalClicks: queries.reduce((s: number, q: any) => s + q.clicks, 0),
      queries, opportunities, refreshed_at: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error", stack: err?.stack?.slice(0, 200) || "" }, { status: 500 });
  }
}
