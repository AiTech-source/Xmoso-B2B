import { createServerSupabaseClient } from "@/lib/supabase/server";

const noCache = { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate", "CDN-Cache-Control": "no-store", "Pragma": "no-cache" };

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") || "home";
  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ banners: [] }, { headers: noCache });

  const { data } = await supabase
    .from("page_banners")
    .select("*")
    .eq("page_key", page)
    .order("sort_order", { ascending: true });

  return Response.json({ banners: data || [] }, { headers: noCache });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { page_key, image_url, alt_text, sort_order, orientation } = body;
  if (!page_key || !image_url) return Response.json({ error: "page_key and image_url required" }, { status: 400, headers: noCache });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "No client" }, { status: 500, headers: noCache });

  const { data, error } = await supabase.from("page_banners").insert({
    page_key, image_url, alt_text: alt_text || "", sort_order: sort_order || 0, orientation: orientation || "landscape",
  }).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500, headers: noCache });
  return Response.json(data, { headers: noCache });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { id, alt_text, image_url, sort_order, orientation } = body;
  if (!id) return Response.json({ error: "ID required" }, { status: 400, headers: noCache });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "No client" }, { status: 500, headers: noCache });

  const updates: any = {};
  if (alt_text !== undefined) updates.alt_text = alt_text;
  if (image_url !== undefined) updates.image_url = image_url;
  if (sort_order !== undefined) updates.sort_order = sort_order;
  if (orientation !== undefined) updates.orientation = orientation;

  const { error } = await supabase.from("page_banners").update(updates).eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500, headers: noCache });
  return Response.json({ ok: true }, { headers: noCache });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return Response.json({ error: "ID required" }, { status: 400, headers: noCache });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "No client" }, { status: 500, headers: noCache });

  const { error } = await supabase.from("page_banners").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500, headers: noCache });
  return Response.json({ ok: true }, { headers: noCache });
}
