import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slugsParam = searchParams.get("slugs");
  const locale = searchParams.get("locale") || "en";

  if (!slugsParam) return Response.json({ products: [] });

  const slugs = slugsParam.split(",").filter(Boolean).slice(0, 4);
  if (!slugs.length) return Response.json({ products: [] });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ products: [] }, { status: 500 });

  // Resolve slugs to product_ids via product_translations (any locale)
  const { data: lookup } = await supabase
    .from("product_translations")
    .select("product_id, slug")
    .in("slug", slugs);

  if (!lookup?.length) return Response.json({ products: [] });

  const productIds = [...new Set(lookup.map((l: any) => l.product_id))];

  // Fetch products
  const { data: products } = await supabase
    .from("products")
    .select("id, model_number, image_gallery, highlights, product_style, energy_rating")
    .in("id", productIds)
    .eq("is_active", true);

  if (!products?.length) return Response.json({ products: [] });

  // Fetch translations for requested locale
  const { data: translations } = await supabase
    .from("product_translations")
    .select("product_id, name, slug, description")
    .eq("locale", locale)
    .in("product_id", productIds);

  const transMap = new Map<string, any>((translations || []).map((t: any) => [t.product_id, t]));

  // Fetch all specs
  const { data: specs } = await supabase
    .from("product_specs")
    .select("*")
    .in("product_id", productIds)
    .order("sort_order", { ascending: true });

  const specsMap = new Map<string, any[]>();
  for (const s of specs || []) {
    if (!specsMap.has(s.product_id)) specsMap.set(s.product_id, []);
    specsMap.get(s.product_id)!.push({
      label: s.label,
      value: s.value,
      sort_order: s.sort_order,
      bgColor: s.bg_color || "",
      fontSize: s.font_size || "",
      color: s.color || "",
    });
  }

  // Preserve original order from slugs
  const slugOrder = new Map<string, number>();
  slugs.forEach((s, i) => slugOrder.set(s, i));

  const result = products
    .map((p: any) => {
      const t = transMap.get(p.id);
      const matchingLookup = lookup.find((l: any) => l.product_id === p.id);
      return {
        id: p.id,
        model_number: p.model_number,
        image: p.image_gallery?.[0]?.url || "",
        highlights: p.highlights || [],
        product_style: p.product_style || "",
        energy_rating: p.energy_rating || "",
        name: t?.name || p.model_number,
        slug: matchingLookup?.slug || t?.slug || "",
        description: t?.description || "",
        specs: specsMap.get(p.id) || [],
        _order: slugOrder.get(matchingLookup?.slug || "") ?? 999,
      };
    })
    .sort((a: any, b: any) => a._order - b._order)
    .map(({ _order, ...item }: any) => item);

  return Response.json({ products: result });
}
