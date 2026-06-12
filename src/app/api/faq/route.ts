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

export async function PUT(req: Request) {
  const { id, question, answer, category } = await req.json();
  if (!id) return Response.json({ error: "ID required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "No client" }, { status: 500 });

  const updates: any = { updated_at: new Date().toISOString() };
  if (question !== undefined) updates.question = question;
  if (answer !== undefined) updates.answer = answer;
  if (category !== undefined) updates.category = category;

  const { error } = await supabase.from("faq_items").update(updates).eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
