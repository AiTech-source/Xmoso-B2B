import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;
    const pageKey = form.get("page_key") as string;

    if (!file || !pageKey) {
      return Response.json({ error: "Missing file or page_key" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) return Response.json({ error: "No client" }, { status: 500 });

    // Upload to storage
    const path = `banners/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("products")
      .upload(path, buffer, { upsert: true, contentType: file.type || "image/webp" });

    if (uploadError) return Response.json({ error: uploadError.message }, { status: 500 });

    const { data: { publicUrl } } = supabase.storage.from("products").getPublicUrl(uploadData.path);

    // Detect orientation
    const orientation = file.name.includes("portrait") || file.name.includes("720x1280") ? "portrait" : "landscape";

    // Insert banner record
    const { data: banner, error: insertError } = await supabase.from("page_banners").insert({
      page_key: pageKey,
      image_url: publicUrl,
      alt_text: file.name.replace(/\.[^.]+$/, "").replace(/-/g, " "),
      sort_order: 0,
      orientation,
    }).select().single();

    if (insertError) return Response.json({ error: insertError.message }, { status: 500 });

    return Response.json(banner);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
