import { NextResponse } from "next/server";

export async function GET() {
  const out: Record<string, any> = {};
  try {
    const cid = process.env.GOOGLE_OAUTH_CLIENT_ID || "";
    const cs = process.env.GOOGLE_OAUTH_CLIENT_SECRET || "";
    const suUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const suKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    out.env_ok = !!(cid && cs && suUrl && suKey);
    out.client_id_prefix = cid.slice(0, 25) + "..." || "missing";
    if (!out.env_ok) return NextResponse.json(out);

    const rtBody = await fetch(`${suUrl}/rest/v1/site_settings?key=eq.gsc_refresh_token&select=value`, {
      headers: { apikey: suKey, Authorization: `Bearer ${suKey}` },
    }).then(r => r.json());
    const rt = rtBody?.[0]?.value || "";
    out.has_refresh_token = !!rt;
    out.refresh_token_prefix = rt.slice(0, 30) + "..." || "none";
    if (!rt) return NextResponse.json(out);

    const oaBody = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ refresh_token: rt, client_id: cid, client_secret: cs, grant_type: "refresh_token" }),
    }).then(r => r.json());

    out.oauth_ok = !!oaBody.access_token;
    out.oauth_error = oaBody.error || null;
    if (!oaBody.access_token) return NextResponse.json(out);

    const token = oaBody.access_token as string;

    // GSC sites list
    const listRes = await fetch("https://searchconsole.googleapis.com/v1/sites", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const listData = await listRes.json().catch(() => ({}));
    out.gsc_list_status = listRes.status;
    out.gsc_sites = (listData.siteEntry || []).map((s: any) => s.siteUrl);
    out.gsc_site_count = out.gsc_sites.length;
  } catch (e: any) {
    out.error = e.message;
  }
  return NextResponse.json(out);
}
