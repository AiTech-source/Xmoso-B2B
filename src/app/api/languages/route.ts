import { createServerSupabaseClient } from "@/lib/supabase/server";

const LOCALE_META: Record<string, { flag: string; label: string; native: string }> = {
  en: { flag: "🇬🇧", label: "English", native: "English" },
  zh: { flag: "🇨🇳", label: "Chinese", native: "中文" },
  fr: { flag: "🇫🇷", label: "French", native: "Français" },
  de: { flag: "🇩🇪", label: "German", native: "Deutsch" },
  no: { flag: "🇳🇴", label: "Norwegian", native: "Norsk" },
  fi: { flag: "🇫🇮", label: "Finnish", native: "Suomi" },
  sv: { flag: "🇸🇪", label: "Swedish", native: "Svenska" },
};

const ALL_LOCALES = Object.keys(LOCALE_META);

function settingKey(locale: string) {
  return `lang_enabled_${locale}`;
}

export type LanguageEntry = {
  locale: string;
  enabled: boolean;
  flag: string;
  label: string;
  native: string;
};

// GET /api/languages — return all languages with enabled status
export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    const fallback = Object.entries(LOCALE_META).map(([locale, meta]) => ({
      locale,
      enabled: locale === "en",
      ...meta,
    }));
    return Response.json({ languages: fallback });
  }

  // Read language switch settings from site_settings table
  const keys = ALL_LOCALES.map((l) => settingKey(l));
  const { data: rows } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", keys);

  const lookup: Record<string, boolean> = {};
  if (rows) {
    for (const row of rows) {
      lookup[row.key] = row.value === "true";
    }
  }

  const languages = Object.entries(LOCALE_META).map(([locale, meta]) => ({
    locale,
    enabled: lookup[settingKey(locale)] ?? locale === "en",
    ...meta,
  }));

  return Response.json({ languages });
}

// POST /api/languages — toggle a language's enabled status
export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return Response.json({ error: "No Supabase client" }, { status: 500 });
  }

  const { locale, enabled } = await req.json();

  if (!locale || !LOCALE_META[locale]) {
    return Response.json({ error: "Invalid locale" }, { status: 400 });
  }
  if (typeof enabled !== "boolean") {
    return Response.json({ error: "enabled must be boolean" }, { status: 400 });
  }

  const key = settingKey(locale);
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key, value: enabled ? "true" : "false" }, { onConflict: "key" });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ locale, enabled });
}
