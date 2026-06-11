import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function sitemap() {
  const baseUrl = "https://xmoso.com";
  const supabase = await createServerSupabaseClient();

  const locales = ["en", "zh"];
  const staticPages = ["", "products", "about", "contact", "faq"];
  const staticEntries = locales.flatMap((locale) =>
    staticPages.map((page) => ({
      url: `${baseUrl}/${locale}${page ? `/${page}` : ""}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: page === "" ? 1.0 : 0.8,
    }))
  );

  let productEntries: any[] = [];
  if (supabase) {
    const { data: translations } = await supabase
      .from("product_translations")
      .select("slug, locale");
    productEntries = (translations || []).map((t: any) => ({
      url: `${baseUrl}/${t.locale}/products/${t.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));
  }

  return [...staticEntries, ...productEntries];
}
