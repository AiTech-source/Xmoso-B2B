import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ types: [] });

  const { data } = await supabase.from("product_types").select("*").order("sort_order");
  return Response.json({ types: data || [] });
}

export async function POST(req: Request) {
  const { name } = await req.json();
  if (!name) return Response.json({ error: "Name required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "No client" }, { status: 500 });

  // Auto-assign next sort_order
  const { data: maxOrder } = await supabase
    .from("product_types").select("sort_order").order("sort_order", { ascending: false }).limit(1);
  const nextOrder = (maxOrder?.[0]?.sort_order ?? 0) + 1;
  const { data, error } = await supabase
    .from("product_types").insert({ name, sort_order: nextOrder }).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data);
}

export async function PUT(req: Request) {
  const { id, name, sort_order } = await req.json();
  if (!id) return Response.json({ error: "ID required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "No client" }, { status: 500 });

  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (sort_order !== undefined) updates.sort_order = sort_order;

  const { error } = await supabase.from("product_types").update(updates).eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return Response.json({ error: "ID required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "No client" }, { status: 500 });

  const { error } = await supabase.from("product_types").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
