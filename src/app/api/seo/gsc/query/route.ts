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

    // Check which Google account this token belongs to
    const infoRes = await fetch("https://www.googleapis.com/oauth2/v2/tokeninfo?access_token=" + token);
    const info = await infoRes.json();

    // Try GSC sites list
    const listRes = await fetch("https://searchconsole.googleapis.com/v1/sites", {
      headers: { Authorization: `Bearer ${token}` },
    });
    let sites: string[] = [];
    if (listRes.ok) {
      const listData = await listRes.json();
      sites = (listData.siteEntry || []).map((s: any) => s.siteUrl);
    }

    const result: any = {
      token_email: info.email || info.user_id || "unknown",
      token_scope: info.scope?.slice(0, 100) || "unknown",
      gsc_sites: sites,
      gsc_list_status: listRes.status,
    };

    // If sites found, query analytics
    const candidates = sites.length > 0 ? sites : ["sc_domain:xmoso.com", "https://xmoso.com/"];
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 28 * 86400000).toISOString().split("T")[0];
    let queryResult = null;
    let tried = "";

    for (const siteUrl of candidates) {
      tried += ` ${siteUrl}`;
      const gscRes = await fetch(`https://searchconsole.googleapis.com/v1/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate, dimensions: ["query"], rowLimit: 25 }),
      });
      if (!gscRes.ok) { tried += `=${gscRes.status}`; continue; }
      queryResult = await gscRes.json();
      tried += `=OK`;
      break;
    }

    if (!queryResult) {
      result.gsc_error = "all failed";
      result.gsc_tried = tried;
      // OAuth still valid but no GSC access — likely wrong account
      if (sites.length === 0 && listRes.status === 401) {
        result.hint = "Token expired or invalid. Re-authorize at /api/seo/gsc/auth";
      } else if (sites.length === 0) {
        result.hint = `The Google account "${info.email || info.user_id || '?'}" has no GSC sites. Make sure this account owns xmoso.com in Search Console.`;
      }
      return NextResponse.json(result);
    }

    const qs = (queryResult.rows || []).map((r: any) => ({
      query: r.keys?.[0] || "", impressions: r.impressions || 0, clicks: r.clicks || 0, ctr: r.ctr || 0, position: Math.round((r.position || 0) * 10) / 10,
    }));
    return NextResponse.json({
      siteUrl: candidates.find((c, i) => tried.split(" ")[i + 1]?.endsWith("=OK")) || "unknown",
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
