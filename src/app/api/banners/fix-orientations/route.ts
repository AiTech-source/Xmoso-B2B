import { createServerSupabaseClient } from "@/lib/supabase/server";
import sharp from "sharp";

async function fetchOrientation(url: string): Promise<"landscape" | "portrait" | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const metadata = await sharp(Buffer.from(buffer)).metadata();
    if (metadata.width && metadata.height) {
      return metadata.width >= metadata.height ? "landscape" : "portrait";
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "No DB" }, { status: 500 });

  const { data: banners, error } = await supabase.from("page_banners").select("id, image_url, orientation");
  if (error) return Response.json({ error: error.message }, { status: 500 });

  let fixed = 0, failed = 0;
  for (const b of banners || []) {
    const detected = await fetchOrientation(b.image_url);
    if (detected && detected !== b.orientation) {
      await supabase.from("page_banners").update({ orientation: detected }).eq("id", b.id);
      fixed++;
    } else if (!detected) {
      failed++;
    }
  }

  return Response.json({ fixed, failed, total: banners?.length || 0, message: `${fixed} banners fixed, ${failed} failed` });
}
