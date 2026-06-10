import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") || "home";
  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ banners: [] });

  const { data } = await supabase
    .from("page_banners")
    .select("*")
    .eq("page_key", page)
    .order("sort_order", { ascending: true });

  return Response.json({ banners: data || [] });
}
