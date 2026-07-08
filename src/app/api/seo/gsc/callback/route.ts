import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  if (error) return new Response(`Authorization declined`, { status: 400 });
  if (!code) return new Response("No authorization code", { status: 400 });

  const cid = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const cs = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!cid || !cs) return new Response("OAuth not configured", { status: 500 });

  try {
    const tr = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: cid, client_secret: cs, redirect_uri: "https://xmoso.com/api/seo/gsc/callback", grant_type: "authorization_code" }),
    });
    const tokens = await tr.json();
    if (!tokens.refresh_token) {
      return new Response(`No refresh_token. You may need to revoke access and try again. Response: ${JSON.stringify(tokens)}`, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return new Response("DB env missing", { status: 500 });
    const supabase = createClient(url, key);

    await supabase.from("site_settings").upsert({ key: "gsc_refresh_token", value: tokens.refresh_token }, { onConflict: "key" });
    if (tokens.access_token) {
      const exp = Date.now() + (tokens.expires_in || 3600) * 1000;
      await supabase.from("site_settings").upsert({ key: "gsc_access_token", value: tokens.access_token }, { onConflict: "key" });
      await supabase.from("site_settings").upsert({ key: "gsc_token_expiry", value: String(exp) }, { onConflict: "key" });
    }

    return new Response(
      `<html><body style="background:#0A0A0F;color:#E8E8E8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;">
      <div style="text-align:center"><h1 style="color:#009f4b">✅ GSC Connected!</h1>
      <p>Google Search Console is linked to xmoso.com.</p>
      <p>You can close this window and go to Admin → SEO → Analytics.</p></div></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (err: any) {
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
}
