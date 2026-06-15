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
      changeFrequency: (page === "" ? "weekly" : "monthly") as "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never",
      priority: page === "" ? 1.0 : 0.8,
    }))
  );

  let blogEntries: any[] = [];
  if (supabase) {
    const { data: blogPosts } = await supabase
      .from("blog_posts").select("slug, locale, updated_at")
      .eq("published", true);
    blogEntries = (blogPosts || []).map((p: any) => ({
      url: `${baseUrl}/${p.locale}/blog/${p.slug}`,
      lastModified: new Date(p.updated_at || new Date()),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  }

  let productEntries: any[] = [];
  let imageEntries: any[] = [];
  if (supabase) {
    const { data: translations } = await supabase
      .from("product_translations")
      .select("slug, locale, product:products(updated_at, image_gallery, model_number)")
      .order("product_id");

    productEntries = (translations || []).map((t: any) => ({
      url: `${baseUrl}/${t.locale}/products/${t.slug}`,
      lastModified: new Date(t.product?.updated_at || new Date()),
      changeFrequency: "weekly" as const,
      priority: 0.9,
      ...(t.product?.image_gallery?.[0]?.url
        ? { images: [`${t.product.image_gallery[0].url}`] }
        : {}),
    }));
  }

  return [...staticEntries, ...blogEntries, ...productEntries];
}
