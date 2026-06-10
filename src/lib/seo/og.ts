export function ogImageUrl(params: {
  title: string;
  subtitle?: string;
  type?: "product" | "page" | "faq";
  brand?: string;
  logo?: string;
}): string {
  const search = new URLSearchParams();
  search.set("title", params.title.slice(0, 200));
  if (params.subtitle) search.set("subtitle", params.subtitle.slice(0, 100));
  if (params.type && params.type !== "product") search.set("type", params.type);
  if (params.brand) search.set("brand", params.brand.slice(0, 50));
  if (params.logo) search.set("logo", params.logo.slice(0, 300));
  return `/api/og?${search.toString()}`;
}

export async function getOgSettings(supabase: any): Promise<{ brand: string; logoUrl: string }> {
  let brand = "Xmoso";
  let logoUrl = "";
  try {
    if (supabase) {
      const [brandRes, logoRes] = await Promise.all([
        supabase.from("site_settings").select("value").eq("key", "og_brand_name").single(),
        supabase.from("site_settings").select("value").eq("key", "logo_url").single(),
      ]);
      if (brandRes.data?.value) brand = brandRes.data.value;
      if (logoRes.data?.value) logoUrl = logoRes.data.value;
    }
  } catch (_) {}
  return { brand, logoUrl };
}
