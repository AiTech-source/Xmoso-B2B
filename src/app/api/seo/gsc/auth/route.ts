import { NextResponse } from "next/server";

export async function GET() {
  const cid = process.env.GOOGLE_OAUTH_CLIENT_ID;
  if (!cid) return NextResponse.json({ error: "GOOGLE_OAUTH_CLIENT_ID not set" }, { status: 500 });

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", cid);
  authUrl.searchParams.set("redirect_uri", "https://xmoso.com/api/seo/gsc/callback");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/webmasters.readonly");
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  return NextResponse.redirect(authUrl.toString());
}
