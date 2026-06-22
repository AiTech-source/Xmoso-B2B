import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;
    const pageKey = form.get("page_key") as string;

    if (!file || !pageKey) {
      return Response.json({ error: "File and page_key required" }, {
        status: 400,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return Response.json({ error: "DB unavailable" }, {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      });
    }

    // 1. Upload file to storage
    const ext = file.name.match(/\.(png|jpg|jpeg|webp)$/i)?.[0] || ".webp";
    const path = `banners/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const buffer = await file.arrayBuffer();

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("products")
      .upload(path, buffer, {
        upsert: true,
        contentType: file.type || "image/webp",
      });

    if (uploadError) {
      return Response.json({ error: uploadError.message }, {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const { data: { publicUrl } } = supabase.storage.from("products").getPublicUrl(uploadData.path);

    // 2. Insert banner record
    const { data: banner, error: insertError } = await supabase
      .from("page_banners")
      .insert({
        page_key: pageKey,
        image_url: publicUrl,
        alt_text: file.name.replace(/\.[^.]+$/, ""),
        sort_order: 0,
        orientation: "landscape",
      })
      .select()
      .single();

    if (insertError) {
      return Response.json({ error: insertError.message }, {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      });
    }

    return Response.json(banner, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err: any) {
    return Response.json({ error: err.message || "Upload failed" }, {
      status: 500,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
