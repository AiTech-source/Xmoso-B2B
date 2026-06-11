import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const REDIRECTS: Record<string, string> = {
  "/productinfo/1546180.html": "/products/xfs145db-wine-cooler",
  "/productinfo/1546193.html": "/products",
  "/productinfo/1546192.html": "/products/xbc90db-wine-cooler",
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locale = pathname.split("/")[1] || "en";

  // Old URL redirects — match with or without locale prefix
  for (const [oldPath, newPath] of Object.entries(REDIRECTS)) {
    if (pathname === oldPath || pathname === `/${locale}${oldPath}`) {
      return NextResponse.redirect(`https://xmoso.com/${locale}${newPath}`, 301);
    }
  }

  // /ProductInfoCategory?categoryId=xxx → /products
  if (pathname === "/ProductInfoCategory" || pathname === `/${locale}/ProductInfoCategory`) {
    return NextResponse.redirect(`https://xmoso.com/${locale}/products`, 301);
  }

  if (pathname.startsWith("/admin")) {
    return NextResponse.next();
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
