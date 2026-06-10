import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale") || "en";
  const category = searchParams.get("category");

  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ items: [] });

  let query = supabase.from("faq_items").select("*").eq("locale", locale).order("sort_order");
  if (category) query = query.eq("category", category);
  const { data } = await query;

  return Response.json({ items: data || [] });
}
