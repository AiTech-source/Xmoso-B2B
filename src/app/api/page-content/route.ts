import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") || "about";
  const locale = searchParams.get("locale") || "en";
  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ content: { blocks: [] }, title: "" });

  const { data } = await supabase
    .from("page_contents")
    .select("*")
    .eq("page_key", page)
    .eq("locale", locale)
    .maybeSingle();

  return Response.json(data || { title: "", content: { blocks: [] } });
}
