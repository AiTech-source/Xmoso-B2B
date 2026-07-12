export function localePath(locale: string, path = "/") {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (locale === "en") return cleanPath;
  return `/${locale}${cleanPath === "/" ? "" : cleanPath}`;
}

export function absoluteLocaleUrl(locale: string, path = "/") {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://xmoso.com";
  return `${baseUrl}${localePath(locale, path)}`;
}
