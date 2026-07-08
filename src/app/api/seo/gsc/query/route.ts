import { NextRequest, NextResponse } from "next/server";

const SITE = "sc_domain:xmoso.com";

export async function GET(req: NextRequest) {
  try {
    const days = parseInt(req.nextUrl.searchParams.get("days") || "28");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "25");

    // Get credentials from env (runtime, not module scope)
    const cid = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const cs = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    if (!cid || !cs) return NextResponse.json({ error: "GSC OAuth env vars not set" }, { status: 500 });

    // Get refresh token from Supabase REST API directly (no supabase-js)
    const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supaUrl || !supaKey) return NextResponse.json({ error: "Supabase env missing" }, { status: 500 });

    const tokenRes = await fetch(`${supaUrl}/rest/v1/site_settings?select=value&key=eq.gsc_refresh_token&limit=1`, {
      headers: { apikey: supaKey, Authorization: `Bearer ${supaKey}` },
    });
    const tokenData = await tokenRes.json();
    const refreshToken = tokenData?.[0]?.value;
    if (!refreshToken) return NextResponse.json({ error: "No GSC refresh token. Visit /api/seo/gsc/auth first." }, { status: 400 });

    // Exchange refresh token for access token
    const oauthRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ refresh_token: refreshToken, client_id: cid, client_secret: cs, grant_type: "refresh_token" }),
    });
    const oauthData = await oauthRes.json();
    if (!oauthData.access_token) return NextResponse.json({ error: `Token refresh failed: ${JSON.stringify(oauthData).slice(0, 200)}` }, { status: 502 });
    const accessToken = oauthData.access_token;

    // Call GSC API
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
    const gscRes = await fetch(
      `https://searchconsole.googleapis.com/v1/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate, dimensions: ["query"], rowLimit: limit, orderBy: [{ fieldName: "impressions", sortOrder: "DESCENDING" }] }),
      }
    );
    if (!gscRes.ok) return NextResponse.json({ error: `GSC API error (${gscRes.status})` }, { status: 502 });

    const gscData = await gscRes.json();
    const queries = (gscData.rows || []).map((r: any) => ({
      query: r.keys?.[0] || "",
      impressions: r.impressions || 0,
      clicks: r.clicks || 0,
      ctr: r.ctr || 0,
      position: Math.round((r.position || 0) * 10) / 10,
    }));

    const opportunities = queries.filter((q: any) => q.position >= 8 && q.position <= 20 && q.impressions >= 50)
      .sort((a: any, b: any) => (b.impressions / b.position) - (a.impressions / a.position)).slice(0, 10);

    return NextResponse.json({
      totalImpressions: queries.reduce((s: number, q: any) => s + q.impressions, 0),
      totalClicks: queries.reduce((s: number, q: any) => s + q.clicks, 0),
      queries, opportunities, refreshed_at: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}
