import type { SupabaseClient } from "@supabase/supabase-js";

// ── Data types ──

export interface ProductItem {
  slug: string;
  name: string;
  model_number: string;
  image: string;
  highlights: string[];
  product_style: string;
  sort_order: number;
}

export interface CategoryGroup {
  id: string;
  name: string;
  sort_order: number;
  products: ProductItem[];
}

export interface TypeGroup {
  name: string;
  sort_order: number;
  categories: CategoryGroup[];
}

// ── URL-safe anchor for any language ──

export function typeAnchor(name: string): string {
  // For Latin names: readable slug
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (slug.length >= 2) return "t-" + slug;
  // For CJK / other scripts: short hash
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  return "t-" + Math.abs(hash).toString(36);
}

// ── Fetch all products grouped by type → category ──

export async function getProductsByType(
  supabase: SupabaseClient | any,
  locale: string,
): Promise<TypeGroup[]> {
  // 1. Product types (sorted)
  const { data: productTypes } = await supabase
    .from("product_types")
    .select("name, sort_order")
    .order("sort_order", { ascending: true });

  if (!productTypes?.length) return [];

  // 2. Categories (sorted by parent type then sort_order)
  const { data: allCategories } = await supabase
    .from("product_categories")
    .select("*")
    .order("product_type")
    .order("sort_order", { ascending: true });

  if (!allCategories?.length) return [];

  // Group categories by product_type
  const catMap = new Map<string, any[]>();
  for (const c of allCategories) {
    if (!catMap.has(c.product_type)) catMap.set(c.product_type, []);
    catMap.get(c.product_type)!.push(c);
  }

  // 3. Active products (sorted)
  const { data: allProducts } = await supabase
    .from("products")
    .select("id, model_number, category_id, image_gallery, highlights, product_style, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (!allProducts?.length) return [];

  // 4. Translations for current locale
  const { data: translations } = await supabase
    .from("product_translations")
    .select("slug, name, product_id")
    .eq("locale", locale)
    .in("product_id", allProducts.map((p: any) => p.id));

  const transMap = new Map<string, any>();
  for (const t of translations || []) transMap.set(t.product_id, t);

  // 5. Assemble result
  const result: TypeGroup[] = [];

  for (const pt of productTypes) {
    const categories = catMap.get(pt.name);
    if (!categories?.length) continue;

    const catsWithProducts: CategoryGroup[] = [];

    for (const cat of categories) {
      const products: ProductItem[] = allProducts
        .filter((p: any) => p.category_id === cat.id)
        .map((p: any) => {
          const t = transMap.get(p.id);
          return {
            slug: t?.slug || "",
            name: t?.name || p.model_number,
            model_number: p.model_number,
            image: p.image_gallery?.[0]?.url || "",
            highlights: p.highlights || [],
            product_style: p.product_style || "",
            sort_order: p.sort_order ?? 999,
          };
        })
        .sort((a: ProductItem, b: ProductItem) => a.sort_order - b.sort_order);

      if (products.length > 0) {
        catsWithProducts.push({
          id: cat.id,
          name: cat.name,
          sort_order: cat.sort_order,
          products,
        });
      }
    }

    if (catsWithProducts.length > 0) {
      result.push({
        name: pt.name,
        sort_order: pt.sort_order,
        categories: catsWithProducts,
      });
    }
  }

  return result;
}
