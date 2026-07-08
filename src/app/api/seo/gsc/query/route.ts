import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Step 1 - just test the function runs
  const suUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const suKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!suUrl || !suKey) return NextResponse.json({ step: "fail", msg: "env missing" }, { status: 500 });

  // Step 2 - query Supabase
  const rtRes = await fetch(`${suUrl}/rest/v1/site_settings?key=eq.gsc_refresh_token&select=value`, {
    headers: { apikey: suKey, Authorization: `Bearer ${suKey}` },
  });
  if (!rtRes.ok) return NextResponse.json({ step: 2, error: `supabase ${rtRes.status}` }, { status: 502 });
  const rtData = await rtRes.json();
  const refreshToken = rtData?.[0]?.value;
  if (!refreshToken) return NextResponse.json({ step: 3, error: "no refresh token" }, { status: 400 });

  // Step 3 - OAuth
  const cid = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const cs = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!cid || !cs) return NextResponse.json({ step: 4, error: "oauth env missing" }, { status: 500 });

  const body = new URLSearchParams();
  body.set("refresh_token", refreshToken);
  body.set("client_id", cid);
  body.set("client_secret", cs);
  body.set("grant_type", "refresh_token");

  const oaRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const oaData = await oaRes.json();
  if (!oaData.access_token) return NextResponse.json({ step: 5, error: oaData.error || "no token", detail: oaData }, { status: 502 });

  // Step 4 - GSC API
  const days = parseInt(req.nextUrl.searchParams.get("days") || "28");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "25");
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
  const site = "sc_domain:xmoso.com";

  const gscRes = await fetch(`https://searchconsole.googleapis.com/v1/sites/${encodeURIComponent(site)}/searchAnalytics/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${oaData.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ startDate, endDate, dimensions: ["query"], rowLimit: limit }),
  });
  if (!gscRes.ok) {
    const err = await gscRes.text().catch(() => "");
    return NextResponse.json({ step: 6, error: `gsc ${gscRes.status}`, detail: err.slice(0, 300) }, { status: 502 });
  }

  const gsc = await gscRes.json();
  const queries = (gsc.rows || []).map((r: any) => ({
    query: r.keys?.[0] || "", impressions: r.impressions || 0, clicks: r.clicks || 0, ctr: r.ctr || 0, position: Math.round((r.position || 0) * 10) / 10,
  }));

  return NextResponse.json({
    totalImpressions: queries.reduce((s: number, q: any) => s + q.impressions, 0),
    totalClicks: queries.reduce((s: number, q: any) => s + q.clicks, 0),
    queries,
    opportunities: queries.filter((q: any) => q.position >= 8 && q.position <= 20 && q.impressions >= 50)
      .sort((a: any, b: any) => (b.impressions / b.position) - (a.impressions / a.position)).slice(0, 10),
    refreshed_at: new Date().toISOString(),
  });
}
