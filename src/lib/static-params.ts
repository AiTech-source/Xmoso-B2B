import { createClient } from "@supabase/supabase-js";

/** Active locales for static generation */
export const ACTIVE_LOCALES = ["en", "zh"];

// Direct client (no cookies) for build-time static generation
function createStaticClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Generate static params for simple pages (about, contact, faq, sourcing, sustainable)
 * Pre-builds for every active locale at deploy time — zero cold starts.
 */
export async function generateLocaleParams() {
  return ACTIVE_LOCALES.map((locale) => ({ locale }));
}

/**
 * Generate static params for product detail pages.
 * Queries all active products with EN translations at build time.
 * New products added via admin will be picked up by ISR revalidation.
 */
export async function generateProductSlugParams() {
  const supabase = createStaticClient();
  if (!supabase) return ACTIVE_LOCALES.map((locale) => ({ locale, slug: "placeholder" }));

  const { data: translations } = await supabase
    .from("product_translations")
    .select("slug, locale")
    .in("locale", ACTIVE_LOCALES)
    .not("slug", "is", null);

  if (!translations?.length) return ACTIVE_LOCALES.map((locale) => ({ locale, slug: "placeholder" }));

  const params: { locale: string; slug: string }[] = [];
  for (const locale of ACTIVE_LOCALES) {
    const slugs = translations.filter((t: any) => t.locale === locale).map((t: any) => t.slug);
    for (const slug of slugs) {
      params.push({ locale, slug });
    }
  }
  return params;
}

/**
 * Generate static params for blog post detail pages.
 */
export async function generateBlogSlugParams() {
  const supabase = createStaticClient();
  if (!supabase) return ACTIVE_LOCALES.map((locale) => ({ locale, slug: "hello-world" }));

  const { data: posts } = await supabase
    .from("product_translations")
    .select("slug, locale")
    .eq("locale", "en")
    .not("slug", "is", null);

  if (!posts?.length) return ACTIVE_LOCALES.map((locale) => ({ locale, slug: "hello-world" }));

  const params: { locale: string; slug: string }[] = [];
  for (const locale of ACTIVE_LOCALES) {
    for (const post of posts) {
      params.push({ locale, slug: post.slug });
    }
  }
  return params;
}
