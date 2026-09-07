import createMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const REDIRECTS: Record<string, string> = {
  "/productinfo/1546180.html": "/products/xfs145db-wine-cooler",
  "/productinfo/1546193.html": "/products",
  "/productinfo/1546192.html": "/products/xbc90db-wine-cooler",
};

const VALID_LOCALES = ["en", "zh", "fr", "de", "no", "fi", "sv"];

/**
 * Known AI/SEO crawler user-agent patterns.
 * We serve these bots a clean HTML with full hreflang signals — never a soft-404.
 */
const AI_BOT_PATTERNS = [
  /googlebot/i,
  /google-inspectiontool/i,
  /perplexity/i,
  /bingbot/i,
  /chatgpt/i,
  /gptbot/i,
  /claude/i,
  /anthropic/i,
  /duckduckbot/i,
  /baiduspider/i,
  /yandex/i,
  /ahrefsbot/i,
  /semrushbot/i,
  /mj12bot/i,
];

function isBot(request: NextRequest): boolean {
  const ua = request.headers.get("user-agent") || "";
  return AI_BOT_PATTERNS.some((p) => p.test(ua));
}

// Cloudflare must NOT cache Next.js page responses (HTML or RSC payload),
// because RSC builds are tied to a specific deployment build ID.
// Cached old RSC data causes "0:{"f":.." rendering errors on navigation.
// Note: Cache-Control is handled by next.config.ts headers (runs post-response);
// we only set CDN-Cache-Control here as a hint.
function preventCdnCache(response: NextResponse) {
  response.headers.set("CDN-Cache-Control", "no-store");
  return response;
}

/**
 * Add GEO / i18n signal headers to every response.
 *
 * Vary: Accept-Language — tells CDNs and search crawlers that content
 *   varies by language. Prevents serving wrong locale from edge cache.
 * X-Robots-Tag — for bot pages we explicitly allow indexing;
 *   prevents AI crawlers from skipping non-English pages.
 */
function addGeoHeaders(response: NextResponse, request: NextRequest) {
  // Note: Vercel's platform layer overwrites the Vary header after middleware
  // runs, so we cannot append Accept-Language here. The locale-specific
  // caching is handled via:
  //   1. hreflang in HTML <link> tags (page metadata)
  //   2. Link HTTP header with alternate+hreflang (for crawlers)
  //   3. Cloudflare Cache Rule based on x-locale cookie or URL path
  //
  // Cloudflare Dashboard → Rules → Cache Rules:
  //   "Cache By": Include Cookie → x-locale (from NEXT_LOCALE cookie)

  // Tell bots all localized versions exist
  if (isBot(request)) {
    response.headers.set("X-Robots-Tag", "index, follow");
    // Add Link header with hreflang hints for crawlers that parse headers
    const siteUrl = "https://xmoso.com";
    const path = request.nextUrl.pathname.replace(/^\/(en|zh|fr|de|no|fi|sv)/, "") || "/";
    const links: string[] = [];
    for (const lc of VALID_LOCALES) {
      const prefix = lc === "en" ? "" : `/${lc}`;
      links.push(`<${siteUrl}${prefix}${path}>; rel="alternate"; hreflang="${lc === "zh" ? "zh-Hans" : lc}"`);
    }
    links.push(`<${siteUrl}${path}>; rel="alternate"; hreflang="x-default"`);
    response.headers.set("Link", links.join(", "));
  }

  return response;
}

async function refreshSupabaseSession(request: NextRequest, response: NextResponse) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headersToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
        Object.entries(headersToSet).forEach(([name, value]) => {
          response.headers.set(name, value);
        });
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const firstSeg = pathname.split("/")[1] || "";
  const locale = VALID_LOCALES.includes(firstSeg) ? firstSeg : "en";

  // Old URL redirects — match with or without locale prefix
  for (const [oldPath, newPath] of Object.entries(REDIRECTS)) {
    if (pathname === oldPath || pathname === `/${locale}${oldPath}`) {
      const prefix = locale === "en" ? "" : `/${locale}`;
      return NextResponse.redirect(`https://xmoso.com${prefix}${newPath}`, 301);
    }
  }

  // Old sitemap.xml → new sitemap-index.xml (GSC caching issue)
  if (pathname === "/sitemap.xml") {
    return NextResponse.redirect(new URL("https://xmoso.com/sitemap-index.xml"), 301);
  }

  // /ProductInfoCategory?categoryId=xxx → /products
  if (pathname === "/ProductInfoCategory" || pathname === `/${locale}/ProductInfoCategory`) {
    const prefix = locale === "en" ? "" : `/${locale}`;
    return NextResponse.redirect(`https://xmoso.com${prefix}/products`, 301);
  }

  let response: NextResponse;
  if (pathname.startsWith("/admin")) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-xmoso-admin-route", "1");
    response = NextResponse.next({ request: { headers: requestHeaders } });
  } else {
    response = intlMiddleware(request);
  }
  response = await refreshSupabaseSession(request, response);
  return addGeoHeaders(preventCdnCache(response), request);
}

export const config = {
  matcher: ["/((?!.well-known|api|_next|_vercel|.*\\.(?:ico|png|jpg|jpeg|svg|webp|css|js|woff|woff2|ttf|eot|map|json|xml|txt)$).*)"],
};
