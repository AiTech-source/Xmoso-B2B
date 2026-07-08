import { createServerStaticClient } from "@/lib/supabase/server-static";

export default async function sitemap() {
  const baseUrl = "https://xmoso.com";
  const supabase = await createServerStaticClient();

  const locales = ["en", "zh", "fr", "de", "no", "fi", "sv"];
  const staticPages = ["", "products", "about", "contact", "faq", "sourcing", "sustainable", "for-us-market", "for-eu-market", "insights"];
  const staticEntries = locales.flatMap((locale) =>
    staticPages.map((page) => ({
      url: `${baseUrl}/${locale}${page ? `/${page}` : ""}`,
      lastModified: new Date(),
      changeFrequency: (page === "" ? "weekly" : "monthly") as "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never",
      priority: page === "" ? 1.0 : 0.8,
    }))
  );

  let blogEntries: any[] = [];
  let insightsEntries: any[] = [];
  let productEntries: any[] = [];

  if (supabase) {
    const [{ data: blogPosts }, { data: insightsPosts }, { data: translations }] = await Promise.all([
      supabase.from("blog_posts").select("slug, locale, updated_at").eq("published", true),
      supabase.from("seo_articles").select("slug").eq("status", "published"),
      supabase.from("product_translations").select("slug, locale, product:products(updated_at, image_gallery, model_number)").order("product_id"),
    ]);

    blogEntries = (blogPosts || []).map((p: any) => ({
      url: `${baseUrl}/${p.locale}/blog/${p.slug}`,
      lastModified: new Date(p.updated_at || new Date()),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

    insightsEntries = (insightsPosts || []).map((p: any) => ({
      url: `${baseUrl}/en/insights/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

    productEntries = (translations || []).map((t: any) => ({
      url: `${baseUrl}/${t.locale}/products/${t.slug}`,
      lastModified: new Date(t.product?.updated_at || new Date()),
      changeFrequency: "weekly" as const,
      priority: 0.9,
      ...(t.product?.image_gallery?.[0]?.url ? { images: [`${t.product.image_gallery[0].url}`] } : {}),
    }));
  }

  return [...staticEntries, ...blogEntries, ...insightsEntries, ...productEntries];
}
