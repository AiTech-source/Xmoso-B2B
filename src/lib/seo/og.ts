export function ogImageUrl(params: {
  title: string;
  subtitle?: string;
  type?: "product" | "page" | "faq";
  brand?: string;
}): string {
  const search = new URLSearchParams();
  search.set("title", params.title.slice(0, 200));
  if (params.subtitle) search.set("subtitle", params.subtitle.slice(0, 100));
  if (params.type && params.type !== "product") search.set("type", params.type);
  if (params.brand) search.set("brand", params.brand.slice(0, 50));
  return `/api/og?${search.toString()}`;
}

export async function getOgSettings(supabase: any): Promise<{ brand: string }> {
  let brand = "Xmoso";
  try {
    if (supabase) {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "og_brand_name").single();
      if (data?.value) brand = data.value;
    }
  } catch (_) {}
  return { brand };
}
