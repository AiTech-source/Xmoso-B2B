const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET || "";
const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID || "";
import { NextRequest, NextResponse } from "next/server";

// Google OAuth config
const REDIRECT_URI = "https://xmoso.com/api/seo/gsc/callback";
const SCOPES = "https://www.googleapis.com/auth/webmasters.readonly";

const SITE_URL = "sc_domain:xmoso.com";

/**
 * GET /api/seo/gsc/auth
 * Redirects to Google OAuth consent screen
 */
export async function GET() {
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", SCOPES);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");

  return NextResponse.redirect(authUrl.toString());
}
