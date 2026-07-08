import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale") || "en";
  const cat = searchParams.get("cat");
  const cats = searchParams.get("cats"); // comma-separated category IDs

  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ products: [] });

  // First get active products filtered by category
  let productQuery = supabase
    .from("products")
    .select("id, model_number, image_gallery, highlights, product_style, sort_order, category_id")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(9);

  if (cat) {
    productQuery = productQuery.eq("category_id", cat);
  } else if (cats) {
    const catIds = cats.split(",").filter(Boolean);
    if (catIds.length > 0) {
      productQuery = productQuery.in("category_id", catIds);
    }
  }

  const { data: products } = await productQuery;
  if (!products || products.length === 0) return Response.json({ products: [] });

  // Get translations
  const ids = products.map((p: any) => p.id);
  const { data: translations } = await supabase
    .from("product_translations")
    .select("slug, name, product_id")
    .eq("locale", locale)
    .in("product_id", ids);

  const result = products.map((p: any) => {
    const t = (translations || []).find((tr: any) => tr.product_id === p.id);
    return {
      slug: t?.slug || "",
      name: t?.name || p.model_number,
      model_number: p.model_number,
      image: p.image_gallery?.[0]?.url || "",
      highlights: p.highlights || [],
      product_style: p.product_style || "",
    };
  });

  return Response.json({ products: result });
}
