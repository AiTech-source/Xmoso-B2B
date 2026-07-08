import { NextResponse } from "next/server";

export async function GET() {
  const out: Record<string, any> = {};

  const cid = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const cs = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  // 1. Check env
  out.env_ok = !!(cid && cs);
  out.client_id_prefix = cid?.slice(0, 20) + "..." || "missing";

  // 2. Get refresh token
  const suUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const suKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const rtBody = await fetch(`${suUrl}/rest/v1/site_settings?key=eq.gsc_refresh_token&select=value`, {
    headers: { apikey: suKey, Authorization: `Bearer ${suKey}` },
  }).then(r => r.json());
  const rt = rtBody?.[0]?.value;
  out.has_refresh_token = !!rt;
  out.refresh_token_prefix = rt?.slice(0, 20) + "..." || "none";

  // 3. Get access token
  const oaBody = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ refresh_token: rt || "none", client_id: cid || "", client_secret: cs || "", grant_type: "refresh_token" }),
  }).then(r => r.json());

  out.oauth_ok = !!oaBody.access_token;
  out.oauth_error = oaBody.error || null;

  if (!oaBody.access_token) return NextResponse.json(out);

  const token = oaBody.access_token;

  // 4. Debug: GSC API available call
  out.gsc_list = await fetch("https://searchconsole.googleapis.com/v1/sites", {
    headers: { Authorization: `Bearer ${token}` },
  }).then(r => Promise.all([r.status, r.json().catch(() => r.text())]));

  // 5. Try site query
  out.gsc_query_xmoso = await fetch("https://searchconsole.googleapis.com/v1/sites/https%3A%2F%2Fxmoso.com%2F/searchAnalytics/query", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ startDate: "2026-06-01", endDate: "2026-07-01", dimensions: ["query"], rowLimit: 3 }),
  }).then(r => Promise.all([r.status, r.json().catch(() => r.text())]));

  out.gsc_query_domain = await fetch("https://searchconsole.googleapis.com/v1/sites/sc_domain%3Axmoso.com/searchAnalytics/query", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ startDate: "2026-06-01", endDate: "2026-07-01", dimensions: ["query"], rowLimit: 3 }),
  }).then(r => Promise.all([r.status, r.json().catch(() => r.text())]));

  // 6. Check what Google Cloud project this is
  out.project = await fetch("https://cloudresourcemanager.googleapis.com/v1/projects?filter=lifecycleState:ACTIVE", {
    headers: { Authorization: `Bearer ${token}` },
  }).then(r => Promise.all([r.status, r.json().catch(() => r.text())]));

  return NextResponse.json(out);
}
