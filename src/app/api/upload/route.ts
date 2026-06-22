import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function noCache() {
  return { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate", "CDN-Cache-Control": "no-store" };
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;
    const path = form.get("path") as string;
    const bucket = form.get("bucket") as string || "products";

    if (!file || !path) {
      return Response.json({ error: "Missing file or path" }, { status: 400, headers: noCache() });
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return Response.json({ error: "Supabase client unavailable" }, { status: 500, headers: noCache() });
    }

    const arrayBuffer = await file.arrayBuffer();
    // Use Uint8Array instead of Buffer for Edge compatibility
    const bytes = new Uint8Array(arrayBuffer);

    const { data, error } = await supabase
      .storage
      .from(bucket)
      .upload(path, bytes, {
        upsert: true,
        contentType: file.type || "image/webp",
      });

    if (error) {
      return Response.json({ error: error.message }, { status: 500, headers: noCache() });
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return Response.json({ url: publicUrl, path: data.path }, { headers: noCache() });
  } catch (err: any) {
    return Response.json({ error: err.message || "Upload failed" }, { status: 500, headers: noCache() });
  }
}
