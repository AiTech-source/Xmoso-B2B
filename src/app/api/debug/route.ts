import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "no supabase client" });

  const { data: products, error: prodErr } = await supabase.from("products").select("*");
  const { data: translations, error: transErr } = await supabase.from("product_translations").select("slug, name, locale, product_id");

  return Response.json({
    products: { count: products?.length || 0, data: products },
    productError: prodErr?.message || null,
    translations: { count: translations?.length || 0, data: translations },
    translationError: transErr?.message || null,
  });
}
