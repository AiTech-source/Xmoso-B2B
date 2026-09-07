import type { SupabaseClient } from "@supabase/supabase-js";
import { cdnUrl } from "./cdn";

// ── Data types ──

export interface ProductItem {
  id: string;
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

interface ProductTypeRow {
  name: string;
  sort_order: number;
}

interface ProductCategoryRow {
  id: string;
  name: string;
  product_type: string;
  sort_order: number;
}

interface ProductRow {
  id: string;
  model_number: string;
  category_id: string;
  image_gallery?: Array<{ url?: string }> | null;
  highlights?: string[] | null;
  product_style?: string | null;
  sort_order?: number | null;
}

interface ProductTranslationRow {
  product_id: string;
  slug: string | null;
  name: string | null;
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
  supabase: SupabaseClient,
  locale: string,
): Promise<TypeGroup[]> {
  // 1. Product types (sorted)
  const { data: productTypes } = await supabase
    .from("product_types")
    .select("name, sort_order")
    .order("sort_order", { ascending: true });

  const typedProductTypes = (productTypes || []) as ProductTypeRow[];
  if (!typedProductTypes.length) return [];

  // 2. Categories (sorted by parent type then sort_order)
  const { data: allCategories } = await supabase
    .from("product_categories")
    .select("*")
    .order("product_type")
    .order("sort_order", { ascending: true });

  const typedCategories = (allCategories || []) as ProductCategoryRow[];
  if (!typedCategories.length) return [];

  // Group categories by product_type
  const catMap = new Map<string, ProductCategoryRow[]>();
  for (const c of typedCategories) {
    if (!catMap.has(c.product_type)) catMap.set(c.product_type, []);
    catMap.get(c.product_type)!.push(c);
  }

  // 3. Active products (sorted)
  const { data: allProducts } = await supabase
    .from("products")
    .select("id, model_number, category_id, image_gallery, highlights, product_style, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const typedProducts = (allProducts || []) as ProductRow[];
  if (!typedProducts.length) return [];

  // 4. Translations for current locale
  const { data: translations } = await supabase
    .from("product_translations")
    .select("slug, name, product_id")
    .eq("locale", locale)
    .in("product_id", typedProducts.map((p) => p.id));

  const transMap = new Map<string, ProductTranslationRow>();
  for (const t of (translations || []) as ProductTranslationRow[]) transMap.set(t.product_id, t);

  // 5. Assemble result
  const result: TypeGroup[] = [];

  for (const pt of typedProductTypes) {
    const categories = catMap.get(pt.name);
    if (!categories?.length) continue;

    const catsWithProducts: CategoryGroup[] = [];

    for (const cat of categories) {
      const products: ProductItem[] = typedProducts
        .filter((p) => p.category_id === cat.id)
        .map((p) => {
          const t = transMap.get(p.id);
          return {
            id: p.id,
            slug: t?.slug || "",
            name: t?.name || p.model_number,
            model_number: p.model_number,
            image: cdnUrl(p.image_gallery?.[0]?.url || "", 400, 60),
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
