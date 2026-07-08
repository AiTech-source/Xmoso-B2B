import { NextResponse } from "next/server";

export async function GET() {
  const diag: Record<string, any> = { _time: Date.now() };

  try {
    // 1. Env
    const suUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const suKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const cid = process.env.GOOGLE_OAUTH_CLIENT_ID || "";
    const cs = process.env.GOOGLE_OAUTH_CLIENT_SECRET || "";
    diag.env = { suUrl: !!suUrl, suKey: !!suKey, cid: cid.slice(0, 15) + "..." };

    // 2. Get refresh token from DB
    const rtBody = await fetch(`${suUrl}/rest/v1/site_settings?key=eq.gsc_refresh_token&select=value`, {
      headers: { apikey: suKey, Authorization: `Bearer ${suKey}` },
    }).then(r => r.json());
    const rt = rtBody?.[0]?.value || "";
    diag.has_rt = !!rt;
    if (!rt) return NextResponse.json({ error: "No refresh token", diag });

    // 3. Exchange for access token
    const oaResp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ refresh_token: rt, client_id: cid, client_secret: cs, grant_type: "refresh_token" }),
    });
    const oaBody = await oaResp.json();
    diag.oauth_status = oaResp.status;
    diag.oauth_error = oaBody.error || null;

    if (!oaBody.access_token) {
      return NextResponse.json({ error: "OAuth failed", diag });
    }

    const token = oaBody.access_token;

    // 4. Test: which Google account is this?
    const infoResp = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const info = await infoResp.json();
    diag.ga_email = info.email || "unknown";

    // 5. Try listing GSC sites via both API versions
    const apiBases = ["https://searchconsole.googleapis.com/v1", "https://www.googleapis.com/webmasters/v3"];
    diag.api_tests = [];

    for (const base of apiBases) {
      const r = await fetch(`${base}/sites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await r.text().catch(() => "");
      diag.api_tests.push({ base, status: r.status, snippet: body.slice(0, 200) });

      if (r.ok) {
        const listBody = JSON.parse(body);
        const allSites = (listBody.siteEntry || []).map((s: any) => s.siteUrl);
        const sites = allSites.filter((s: string) => s.includes("xmoso"));
        if (sites.length === 0) sites.push(...allSites);
        diag.found_sites = allSites;

        // Query analytics for the first valid site
        const endDate = new Date().toISOString().split("T")[0];
        const startDate = new Date(Date.now() - 28 * 86400000).toISOString().split("T")[0];

        // Try both known URLs
        const candidates = sites.length > 0 ? sites : ["sc_domain:xmoso.com", "https://xmoso.com/"];
        for (const siteUrl of candidates) {
          const qr = await fetch(`${base}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ startDate, endDate, dimensions: ["query"], rowLimit: 25 }),
          });
          if (!qr.ok) continue;
          const d = await qr.json();
          const qs = (d.rows || []).map((r: any) => ({
            query: r.keys?.[0] || "", impressions: r.impressions || 0, clicks: r.clicks || 0, ctr: r.ctr || 0, position: Math.round((r.position || 0) * 10) / 10,
          }));
          return NextResponse.json({
            siteUrl, totalImpressions: qs.reduce((s: number, q: any) => s + q.impressions, 0),
            totalClicks: qs.reduce((s: number, q: any) => s + q.clicks, 0),
            queries: qs, opportunities: qs.filter((q: any) => q.position >= 8 && q.position <= 20 && q.impressions >= 50)
              .sort((a: any, b: any) => (b.impressions / b.position) - (a.impressions / a.position)).slice(0, 10),
          });
        }
      }
    }

    diag._elapsed = Date.now() - diag._time;
    return NextResponse.json(diag);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown", diag });
  }
}
