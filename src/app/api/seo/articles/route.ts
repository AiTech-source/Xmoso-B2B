import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("seo_articles")
    .select("id, slug, title, keyword, status, created_at")
    .order("created_at", { ascending: false });

  return NextResponse.json({ articles: data || [] });
}
