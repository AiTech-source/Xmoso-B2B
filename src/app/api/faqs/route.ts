import { createServerSupabaseClient } from "@/lib/supabase/server";

const noCache = { "Cache-Control": "no-store, no-cache, must-revalidate", "CDN-Cache-Control": "no-store" };

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productType = searchParams.get("product_type") || "";
  const locale = searchParams.get("locale") || "en";
  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ faqs: [] }, { headers: noCache });

  // Fetch type-specific questions, also fetch generic (product_type = '') questions
  const { data: typeSpecific } = await supabase
    .from("product_faqs")
    .select("*")
    .eq("product_type", productType)
    .eq("locale", locale)
    .order("sort_order", { ascending: true });

  const { data: generic } = await supabase
    .from("product_faqs")
    .select("*")
    .eq("product_type", "")
    .eq("locale", locale)
    .order("sort_order", { ascending: true });

  return Response.json({ faqs: [...(generic || []), ...(typeSpecific || [])] }, { headers: noCache });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { product_type, locale, question, answer, sort_order } = body;
  if (!question || !answer) {
    return Response.json({ error: "question and answer required" }, { status: 400, headers: noCache });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "No client" }, { status: 500, headers: noCache });

  const { data, error } = await supabase
    .from("product_faqs")
    .insert({
      product_type: product_type || "",
      locale: locale || "en",
      question,
      answer,
      sort_order: sort_order || 0,
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500, headers: noCache });
  return Response.json(data, { headers: noCache });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { id, question, answer, product_type, locale, sort_order } = body;
  if (!id) return Response.json({ error: "ID required" }, { status: 400, headers: noCache });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "No client" }, { status: 500, headers: noCache });

  const updates: any = {};
  if (question !== undefined) updates.question = question;
  if (answer !== undefined) updates.answer = answer;
  if (product_type !== undefined) updates.product_type = product_type;
  if (locale !== undefined) updates.locale = locale;
  if (sort_order !== undefined) updates.sort_order = sort_order;
  updates.updated_at = new Date().toISOString();

  const { error } = await supabase.from("product_faqs").update(updates).eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500, headers: noCache });
  return Response.json({ ok: true }, { headers: noCache });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return Response.json({ error: "ID required" }, { status: 400, headers: noCache });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "No client" }, { status: 500, headers: noCache });

  const { error } = await supabase.from("product_faqs").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500, headers: noCache });
  return Response.json({ ok: true }, { headers: noCache });
}
