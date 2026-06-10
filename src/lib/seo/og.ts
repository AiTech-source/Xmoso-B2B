/**
 * Generate URL for dynamic OG image
 */
export function ogImageUrl(params: {
  title: string;
  subtitle?: string;
  type?: "product" | "page" | "faq";
  brand?: string;
  url?: string;
  logo?: string;
  image?: string;
}): string {
  const search = new URLSearchParams();
  search.set("title", params.title.slice(0, 200));
  if (params.subtitle) search.set("subtitle", params.subtitle.slice(0, 100));
  if (params.type && params.type !== "product") search.set("type", params.type);
  if (params.brand) search.set("brand", params.brand.slice(0, 50));
  if (params.url) search.set("url", params.url.slice(0, 50));
  if (params.logo) search.set("logo", params.logo.slice(0, 300));
  if (params.image) search.set("image", params.image.slice(0, 300));

  return `/api/og?${search.toString()}`;
}

/**
 * Fetch OG settings from DB (brand name, site URL)
 */
export async function getOgSettings(supabase: any): Promise<{ brand: string; siteUrl: string; logoUrl: string }> {
  let brand = "Xmoso";
  let siteUrl = "xmoso.com";
  let logoUrl = "";
  try {
    if (supabase) {
      const [brandRes, urlRes, logoRes] = await Promise.all([
        supabase.from("site_settings").select("value").eq("key", "og_brand_name").single(),
        supabase.from("site_settings").select("value").eq("key", "og_site_url").single(),
        supabase.from("site_settings").select("value").eq("key", "logo_url").single(),
      ]);
      if (brandRes.data?.value) brand = brandRes.data.value;
      if (urlRes.data?.value) siteUrl = urlRes.data.value;
      if (logoRes.data?.value) logoUrl = logoRes.data.value;
    }
  } catch (_) {}
  return { brand, siteUrl, logoUrl };
}
