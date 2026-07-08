import { NextResponse } from "next/server";

export async function GET() {
  const results: Record<string, any> = {};

  // Test 1: env vars presence
  results.cid = process.env.GOOGLE_OAUTH_CLIENT_ID ? "✅ set" : "❌ missing";
  results.cs = process.env.GOOGLE_OAUTH_CLIENT_SECRET ? "✅ set" : "❌ missing";
  results.supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ set" : "❌ missing";
  results.supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ set" : "❌ missing";

  // Test 2: fetch Supabase
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const res = await fetch(`${supabaseUrl}/rest/v1/site_settings?select=value&key=eq.gsc_refresh_token&limit=1`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
    });
    results.supabaseStatus = res.status;
    if (res.ok) {
      const data = await res.json();
      results.hasRefreshToken = data?.[0]?.value ? "✅ yes" : "❌ no";
      results.supabaseRaw = data;
    } else {
      results.supabaseError = await res.text().then(t => t.slice(0, 200)).catch(() => "error reading body");
    }
  } catch (e: any) {
    results.supabaseError = e?.message || "unknown";
  }

  // Test 3: simple fetch to Google OAuth
  try {
    const cid = process.env.GOOGLE_OAUTH_CLIENT_ID || "";
    const cs = process.env.GOOGLE_OAUTH_CLIENT_SECRET || "";
    const oauthRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: "test",
        client_id: cid,
        client_secret: cs,
        grant_type: "refresh_token",
      }),
    });
    results.oauthStatus = oauthRes.status;
    const oauthData = await oauthRes.json();
    results.oauthError = oauthData?.error || "none (expected: invalid_grant because token is fake)";
  } catch (e: any) {
    results.oauthError = e?.message || "unknown";
  }

  return NextResponse.json(results);
}
