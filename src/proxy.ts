import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const REDIRECTS: Record<string, string> = {
  "/productinfo/1546180.html": "/products/xfs145db-wine-cooler",
  "/productinfo/1546193.html": "/products",
  "/productinfo/1546192.html": "/products/xbc90db-wine-cooler",
};

const VALID_LOCALES = ["en", "zh"];

export function proxy(request: NextRequest) {
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

  // Bypass Cloudflare cache for Next.js RSC payloads (text/x-component)
  const accept = request.headers.get("accept") || "";
  if (accept.includes("text/x-component")) {
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
    response.headers.set("CDN-Cache-Control", "no-store");
    return response;
  }

  if (pathname.startsWith("/admin")) {
    return NextResponse.next();
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\.(?:ico|png|jpg|jpeg|svg|webp|css|js|woff|woff2|ttf|eot|map|json|xml)$).*)"],
};
