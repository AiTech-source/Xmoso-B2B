import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;
    const path = form.get("path") as string;
    const bucket = form.get("bucket") as string || "products";

    if (!file || !path) {
      return Response.json({ error: "Missing file or path" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return Response.json({ error: "Supabase client unavailable" }, { status: 500 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const { data, error } = await supabase
      .storage
      .from(bucket)
      .upload(path, buffer, {
        upsert: true,
        contentType: file.type || "image/png",
      });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return Response.json({ url: publicUrl, path: data.path });
  } catch (err: any) {
    return Response.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}
