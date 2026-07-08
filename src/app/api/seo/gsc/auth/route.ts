import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const cid = process.env.GOOGLE_OAUTH_CLIENT_ID || "";
  const isDebug = req.nextUrl.searchParams.has("debug");

  if (!cid) return NextResponse.json({ error: "GOOGLE_OAUTH_CLIENT_ID not set" }, { status: 500 });

  if (isDebug) {
    return NextResponse.json({
      client_id: cid,
      client_id_suffix: cid.slice(-20),
      length: cid.length,
      looks_like_web_app: cid.includes("apps.googleusercontent.com") && cid.length > 50,
    });
  }

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", cid);
  authUrl.searchParams.set("redirect_uri", "https://xmoso.com/api/seo/gsc/callback");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/webmasters https://www.googleapis.com/auth/userinfo.email");
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("include_granted_scopes", "true");
  return NextResponse.redirect(authUrl.toString());
}
