import { createServerSupabaseClient } from "@/lib/supabase/server";

const ALL_KEYS = [
  "default_theme", "logo_url",
  "footer_logo_url", "footer_sustainability", "footer_company", "footer_address", "footer_email",
  "social_youtube", "social_instagram", "social_tiktok", "social_linkedin", "social_wechat_qr",
  "favicon_url", "site_title",
  "og_brand_name", "og_site_url",
];

async function getSetting(supabase: any, key: string): Promise<string> {
  const { data } = await supabase.from("site_settings").select("value").eq("key", key).single();
  return data?.value || "";
}

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    const result: Record<string, string> = {};
    ALL_KEYS.forEach((k) => { result[k] = ""; });
    return Response.json(result);
  }

  const result: Record<string, string> = {};
  for (const key of ALL_KEYS) {
    result[key] = await getSetting(supabase, key);
  }

  return Response.json(result);
}

export async function POST(req: Request) {
  const { key, value } = await req.json();
  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "No client" }, { status: 500 });

  if (!key || !ALL_KEYS.includes(key)) {
    return Response.json({ error: "Invalid key" }, { status: 400 });
  }

  const { error } = await supabase
    .from("site_settings")
    .upsert({ key, value }, { onConflict: "key" });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ [key]: value });
}
