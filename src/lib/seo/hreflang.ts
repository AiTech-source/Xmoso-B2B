/**
 * Hreflang / GEO utility for AI crawler signals.
 *
 * Generates proper hreflang and canonical alternates for Googlebot,
 * Perplexity, Bingbot, and other AI/SEO crawlers.
 *
 * Locale → hreflang mapping:
 *   en → en (English, global)
 *   zh → zh-Hans (Simplified Chinese)
 *   fr → fr
 *   de → de
 *   no → no
 *   fi → fi
 *   sv → sv
 */

import type { Metadata } from "next";

/** All supported locales. */
export const ALL_LOCALES = ["en", "zh", "fr", "de", "no", "fi", "sv"] as const;

/** Map internal locale codes to BCP 47 hreflang values. */
export const HREFLANG_MAP: Record<string, string> = {
  en: "en",
  zh: "zh-Hans",
  fr: "fr",
  de: "de",
  no: "no",
  fi: "fi",
  sv: "sv",
};

/**
 * Build alternates.languages dictionary for Next.js Metadata API.
 *
 * @param pathname - path without locale prefix, e.g. "/products" or "/about"
 * @param defaultLocale - default locale (usually "en")
 * @returns Record<'en' | 'zh-Hans' | 'fr' | ..., string>
 *
 * @example
 *   generateHreflangLanguages("/products", "en")
 *   // => { "en": "/products", "zh-Hans": "/zh/products", "fr": "/fr/products", ... }
 */
export function generateHreflangLanguages(
  pathname: string,
  defaultLocale = "en",
): Record<string, string> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://xmoso.com";
  // Normalize: ensure leading "/" and no trailing "/" (unless root)
  let cleanPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (cleanPath.length > 1 && cleanPath.endsWith("/"))
    cleanPath = cleanPath.slice(0, -1);

  const result: Record<string, string> = {};
  for (const locale of ALL_LOCALES) {
    const hreflang = HREFLANG_MAP[locale] || locale;
    const urlPath =
      locale === defaultLocale
        ? cleanPath
        : `/${locale}${cleanPath}`;
    result[hreflang] = `${baseUrl}${urlPath}`;
  }
  // x-default: always the default locale
  result["x-default"] =
    `${baseUrl}${cleanPath}`;
  return result;
}

/**
 * Generate the full alternates object for Next.js Metadata,
 * including canonical + hreflang languages.
 *
 * @param pathname - page path (e.g. "/products")
 * @param currentLocale - current page locale
 * @param defaultLocale - default locale
 */
export function generateAlternates(
  pathname: string,
  currentLocale: string,
  defaultLocale = "en",
): Metadata["alternates"] {
  // Canonical: always point to the current locale's URL
  const canonicalPath =
    currentLocale === defaultLocale
      ? pathname.startsWith("/") ? pathname : `/${pathname}`
      : `/${currentLocale}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
  const canonical = canonicalPath.replace(/\/$/, "") || "/";

  return {
    canonical,
    languages: generateHreflangLanguages(pathname, defaultLocale),
  };
}

/**
 * BCP 47 language tag for the HTML lang attribute.
 */
export function htmlLangTag(locale: string): string {
  return HREFLANG_MAP[locale] || locale;
}