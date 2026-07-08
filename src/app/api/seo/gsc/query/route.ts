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

    // List sites + query analytics
    const listRes = await fetch("https://searchconsole.googleapis.com/v1/sites", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!listRes.ok) return NextResponse.json({ error: `GSC list error: ${listRes.status}` });
    const listData = await listRes.json();
    const sites = (listData.siteEntry || []).map((s: any) => s.siteUrl);
    if (!sites.length) return NextResponse.json({ error: "No GSC sites" });

    const siteUrl = sites[0];
    const [endDate, startDate] = [new Date().toISOString().split("T")[0], new Date(Date.now() - 28 * 86400000).toISOString().split("T")[0]];
    const gscRes = await fetch(`https://searchconsole.googleapis.com/v1/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate, dimensions: ["query"], rowLimit: 25 }),
    });
    if (!gscRes.ok) {
      const err = await gscRes.text().catch(() => "");
      return NextResponse.json({ error: "GSC query failed", siteUrl, status: gscRes.status, detail: err?.slice(0, 300) });
    }

    const d = await gscRes.json();
    const qs = (d.rows || []).map((r: any) => ({
      query: r.keys?.[0] || "", impressions: r.impressions || 0, clicks: r.clicks || 0, ctr: r.ctr || 0, position: Math.round((r.position || 0) * 10) / 10,
    }));

    return NextResponse.json({
      siteUrl, allSites: sites,
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
