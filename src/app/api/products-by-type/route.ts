import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getProductsByType } from "@/lib/products-by-type";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale") || "en";
  const limit = parseInt(searchParams.get("limit") || "0");

  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ types: [] });

  const allTypes = await getProductsByType(supabase, locale);

  if (limit > 0) {
    // Homepage: flatten to N products per type (across all categories)
    const limited = allTypes.map((t) => {
      const products = t.categories
        .flatMap((c) => c.products)
        .slice(0, limit);
      return { name: t.name, sort_order: t.sort_order, products };
    });
    return Response.json({ types: limited });
  }

  // Full detail: grouped by category
  return Response.json({ types: allTypes });
}
