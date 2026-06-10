/**
 * Generate URL for dynamic OG image
 */
export function ogImageUrl(params: {
  title: string;
  model?: string;
  subtitle?: string;
  type?: "product" | "page" | "faq";
  brand?: string;
  url?: string;
}): string {
  const search = new URLSearchParams();
  search.set("title", params.title.slice(0, 100));
  if (params.model) search.set("model", params.model.slice(0, 50));
  if (params.subtitle) search.set("subtitle", params.subtitle.slice(0, 100));
  if (params.type && params.type !== "product") search.set("type", params.type);
  if (params.brand) search.set("brand", params.brand.slice(0, 50));
  if (params.url) search.set("url", params.url.slice(0, 50));

  return `/api/og?${search.toString()}`;
}

/**
 * Fetch OG settings from DB (brand name, site URL)
 */
export async function getOgSettings(supabase: any): Promise<{ brand: string; siteUrl: string }> {
  let brand = "DeepCool";
  let siteUrl = "deepcool.com";
  try {
    if (supabase) {
      const { data: brandData } = await supabase.from("site_settings").select("value").eq("key", "og_brand_name").single();
      const { data: urlData } = await supabase.from("site_settings").select("value").eq("key", "og_site_url").single();
      if (brandData?.value) brand = brandData.value;
      if (urlData?.value) siteUrl = urlData.value;
    }
  } catch (_) {}
  return { brand, siteUrl };
}
