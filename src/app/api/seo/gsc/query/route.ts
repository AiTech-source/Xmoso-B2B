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

    // 5. Try listing GSC sites
    const listResp = await fetch("https://searchconsole.googleapis.com/v1/sites", {
      headers: { Authorization: `Bearer ${token}` },
    });
    diag.list_status = listResp.status;
    const listBody = await listResp.json().catch(() => ({}));
    diag.list_sites = (listBody.siteEntry || []).map((s: any) => s.siteUrl);

    // 6. Try both URL formats with full response info
    const candidates = ["sc_domain:xmoso.com", "https://xmoso.com/"];
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 28 * 86400000).toISOString().split("T")[0];

    diag.tries = [];
    for (const siteUrl of candidates) {
      const r = await fetch(`https://searchconsole.googleapis.com/v1/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate, dimensions: ["query"], rowLimit: 5 }),
      });
      const body = await r.text().catch(() => "");
      diag.tries.push({ siteUrl, status: r.status, body_snippet: body.slice(0, 200) });
    }

    diag._elapsed = Date.now() - diag._time;
    return NextResponse.json(diag);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown", diag });
  }
}
