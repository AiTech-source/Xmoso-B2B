import { NextResponse } from "next/server";

export async function GET() {
  try {
    const suUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const suKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const cid = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const cs = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    if (!suUrl || !suKey || !cid || !cs) {
      return NextResponse.json({ error: "env", have: { suUrl: !!suUrl, suKey: !!suKey, cid: !!cid, cs: !!cs } });
    }

    const rtBody = await fetch(`${suUrl}/rest/v1/site_settings?key=eq.gsc_refresh_token&select=value`, {
      headers: { apikey: suKey, Authorization: `Bearer ${suKey}` },
    }).then(r => r.json());
    const rt = rtBody?.[0]?.value;
    if (!rt) return NextResponse.json({ error: "no refresh token" });

    const oaBody = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `refresh_token=${encodeURIComponent(rt)}&client_id=${encodeURIComponent(cid)}&client_secret=${encodeURIComponent(cs)}&grant_type=refresh_token`,
    }).then(r => r.json());
    if (!oaBody.access_token) return NextResponse.json({ error: "oauth", detail: oaBody.error });

    const now = new Date().toISOString().split("T")[0];
    const past = new Date(Date.now() - 28 * 86400000).toISOString().split("T")[0];

    // Try all possible site URL formats
    const candidates = ["sc_domain:xmoso.com", "https://xmoso.com", "https://xmoso.com/", "https://www.xmoso.com"];
    let gscRes = null;
    let tried = "";
    for (const c of candidates) {
      const enc = encodeURIComponent(c);
      const r = await fetch(`https://searchconsole.googleapis.com/v1/sites/${enc}/searchAnalytics/query`, {
        method: "POST",
        headers: { Authorization: `Bearer ${oaBody.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: past, endDate: now, dimensions: ["query"], rowLimit: 25 }),
      });
      if (r.ok) { gscRes = r; break; }
      tried += ` ${c}=${r.status}`;
    }
    if (!gscRes) return NextResponse.json({ error: "no GSC site matched", tried }, { status: 404 });

    const d = await gscRes.json();
    const qs = (d.rows || []).map((r: any) => ({ query: r.keys?.[0] || "", impressions: r.impressions || 0, clicks: r.clicks || 0, ctr: r.ctr || 0, position: Math.round((r.position || 0) * 10) / 10 }));
    return NextResponse.json({
      totalImpressions: qs.reduce((s: number, q: any) => s + q.impressions, 0),
      totalClicks: qs.reduce((s: number, q: any) => s + q.clicks, 0),
      queries: qs,
      opportunities: qs.filter((q: any) => q.position >= 8 && q.position <= 20 && q.impressions >= 50).sort((a: any, b: any) => (b.impressions / b.position) - (a.impressions / a.position)).slice(0, 10),
      ok: true,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "unknown" });
  }
}
