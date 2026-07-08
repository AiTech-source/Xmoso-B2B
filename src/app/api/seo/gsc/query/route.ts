import { NextResponse } from "next/server";

export async function GET() {
  try {
    const suUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const suKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const cid = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const cs = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    if (!suUrl || !suKey || !cid || !cs)
      return NextResponse.json({ error: "Missing env vars" });

    const rtBody = await fetch(`${suUrl}/rest/v1/site_settings?key=eq.gsc_refresh_token&select=value`, {
      headers: { apikey: suKey, Authorization: `Bearer ${suKey}` },
    }).then(r => r.json());
    const rt = rtBody?.[0]?.value;
    if (!rt) return NextResponse.json({ error: "No GSC refresh token" });

    const oaBody = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ refresh_token: rt, client_id: cid, client_secret: cs, grant_type: "refresh_token" }),
    }).then(r => r.json());
    if (!oaBody.access_token)
      return NextResponse.json({ error: "OAuth failed: " + (oaBody.error || "") });

    const token = oaBody.access_token;

    // Try both known GSC property URLs
    const candidates = ["sc_domain:xmoso.com", "https://xmoso.com/"];
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 28 * 86400000).toISOString().split("T")[0];
    let result = null;
    let tried = "";

    for (const siteUrl of candidates) {
      tried += ` ${siteUrl}`;
      const gscRes = await fetch(`https://searchconsole.googleapis.com/v1/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate, dimensions: ["query"], rowLimit: 25 }),
      });
      if (!gscRes.ok) {
        tried += `=${gscRes.status}`;
        continue;
      }
      result = await gscRes.json();
      tried += `=OK`;
      break;
    }
    if (!result) return NextResponse.json({ error: "GSC: all candidates failed", tried }, { status: 404 });

    const qs = (result.rows || []).map((r: any) => ({
      query: r.keys?.[0] || "", impressions: r.impressions || 0, clicks: r.clicks || 0, ctr: r.ctr || 0, position: Math.round((r.position || 0) * 10) / 10,
    }));
    return NextResponse.json({
      totalImpressions: qs.reduce((s: number, q: any) => s + q.impressions, 0),
      totalClicks: qs.reduce((s: number, q: any) => s + q.clicks, 0),
      queries: qs,
      opportunities: qs.filter((q: any) => q.position >= 8 && q.position <= 20 && q.impressions >= 50)
        .sort((a: any, b: any) => (b.impressions / b.position) - (a.impressions / a.position)).slice(0, 10),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown" });
  }
}
