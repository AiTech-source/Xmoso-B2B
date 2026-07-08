import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ categories: [] });

  const { data } = await supabase
    .from("product_categories")
    .select("*")
    .order("product_type")
    .order("sort_order");

  return Response.json({ categories: data || [] });
}
