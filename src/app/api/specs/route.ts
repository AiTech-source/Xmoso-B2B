import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("product_id");
  const productType = searchParams.get("product_type");
  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ specs: [], templates: [] });

  if (productId) {
    const { data } = await supabase
      .from("product_specs")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true });
    return Response.json({ specs: data || [] });
  }

  if (productType) {
    const { data } = await supabase
      .from("product_spec_templates")
      .select("*")
      .eq("product_type", productType)
      .order("sort_order", { ascending: true });
    return Response.json({ templates: data || [] });
  }

  return Response.json({ specs: [], templates: [] });
}
