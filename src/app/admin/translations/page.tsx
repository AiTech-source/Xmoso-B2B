"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminTranslationsPage() {
  const [translations, setTranslations] = useState<any[]>([]);
  const [locale, setLocale] = useState("en");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    const supabase = createClient();
    if (!supabase) { setError("Supabase not configured"); return; }
    const { data, error: e } = await supabase
      .from("product_translations")
      .select("*, product:products(model_number)")
      .eq("locale", locale)
      .order("name");
    if (e) { setError(e.message); return; }
    setTranslations(data || []);
  }, [locale]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-light tracking-wider text-white">Translations</h1>
          <div className="flex gap-2">
            {(["en", "zh"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLocale(l)}
                className={`px-4 py-2 text-sm tracking-wider rounded-lg border transition-all duration-300 cursor-pointer ${
                  locale === l
                    ? "bg-forest text-deep-dark border-forest"
                    : "bg-transparent text-silver border-silver/30 hover:border-silver hover:text-white"
                }`}
              >
                {l === "en" ? "🇬🇧 English" : "🇨🇳 中文"}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        {translations.length === 0 && !error && (
          <p className="text-silver/40 text-sm mb-4">No translations found for "{locale}".</p>
        )}
        <div className="bg-deep-blue/30 border border-silver/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-silver/10 text-silver/50 text-xs uppercase tracking-wider">
                <th className="text-left p-4">Product</th>
                <th className="text-left p-4">Name</th>
                <th className="text-left p-4">Slug</th>
                <th className="text-left p-4">Locale</th>
              </tr>
            </thead>
            <tbody>
              {translations.map((t) => (
                <tr key={t.id} className="border-b border-silver/5 hover:bg-white/5">
                  <td className="p-4 text-white">{t.product?.model_number || "—"}</td>
                  <td className="p-4 text-silver/80">{t.name}</td>
                  <td className="p-4 text-silver/60 font-mono text-xs">{t.slug}</td>
                  <td className="p-4"><span className="text-xs bg-forest/20 text-forest px-2 py-1 rounded">{t.locale}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
