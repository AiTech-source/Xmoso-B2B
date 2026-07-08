import { NextRequest, NextResponse } from "next/server";

const SITE = "sc_domain:xmoso.com";

function missing(name: string): NextResponse {
  return NextResponse.json({ error: `Missing env: ${name}` }, { status: 500 });
}

export async function GET(req: NextRequest) {
  try {
    const days = parseInt(req.nextUrl.searchParams.get("days") || "28");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "25");

    const cid = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const cs = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    if (!cid) return missing("GOOGLE_OAUTH_CLIENT_ID");
    if (!cs) return missing("GOOGLE_OAUTH_CLIENT_SECRET");

    const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supaUrl) return missing("NEXT_PUBLIC_SUPABASE_URL");
    if (!supaKey) return missing("SUPABASE_SERVICE_ROLE_KEY");

    // Use Supabase REST API to get refresh token
    const headers = { "apikey": supaKey, "Authorization": `Bearer ${supaKey}`, "Content-Type": "application/json" };
    const url = `${supaUrl}/rest/v1/site_settings?key=eq.gsc_refresh_token&select=value`;

    const rtRes = await fetch(url, { headers });
    if (!rtRes.ok) return NextResponse.json({ error: `Supabase query failed: ${rtRes.status}` }, { status: 502 });
    const rtData = await rtRes.json();
    const refreshToken = rtData?.[0]?.value;
    if (!refreshToken) return NextResponse.json({ error: "No GSC refresh token found. Visit /api/seo/gsc/auth first." }, { status: 400 });

    // Exchange for access token
    const oauthRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ refresh_token: refreshToken, client_id: cid, client_secret: cs, grant_type: "refresh_token" }),
    });
    const oauth = await oauthRes.json();
    if (!oauth.access_token) return NextResponse.json({ error: `OAuth failed: ${oauth?.error || "unknown"}`, detail: oauth }, { status: 502 });

    const accessToken = oauth.access_token;

    // Query GSC Search Analytics
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

    const data = await gscRes.json();
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
      queries, opportunities, refreshed_at: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
