const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET || "";
const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID || "";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const REDIRECT_URI = "https://xmoso.com/api/seo/gsc/callback";

/**
 * GET /api/seo/gsc/callback?code=xxxx
 * Google redirects here after user authorizes
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return new Response(`Authorization declined: ${error}`, { status: 400 });
  }
  if (!code) {
    return new Response("No authorization code received", { status: 400 });
  }

  try {
    // Exchange code for tokens
    const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResp.json();

    if (!tokens.refresh_token) {
      return new Response(`No refresh_token received. Make sure to set prompt=consent and access_type=offline. Response: ${JSON.stringify(tokens)}`, { status: 400 });
    }

    // Store tokens in site_settings (direct client, no cookies needed)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return new Response("DB env missing", { status: 500 });
    const supabase = createClient(url, key);

    await supabase.from("site_settings").upsert(
      { key: "gsc_refresh_token", value: tokens.refresh_token },
      { onConflict: "key" }
    );

    // Show success
    return new Response(`
      <html><body style="background:#0A0A0F;color:#E8E8E8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;">
      <div style="text-align:center">
        <h1 style="color:#009f4b">✅ GSC Connected!</h1>
        <p>Google Search Console is now linked to xmoso.com.</p>
        <p>Access token expires: ${new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toLocaleString()}</p>
        <p style="color:#666;font-size:13px">You can close this window.</p>
      </div></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (err: any) {
    return new Response(`Token exchange failed: ${err.message}`, { status: 500 });
  }
}
