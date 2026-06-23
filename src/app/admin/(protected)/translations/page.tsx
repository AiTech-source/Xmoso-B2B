"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Button from "@/components/ui/Button";

export default function AdminTranslationsPage() {
  const supabase = createClient();
  const [translations, setTranslations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [locale, setLocale] = useState("en");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editMetaTitle, setEditMetaTitle] = useState("");
  const [editMetaDesc, setEditMetaDesc] = useState("");
  const [editOgImage, setEditOgImage] = useState("");
  const [creating, setCreating] = useState(false);
  const [createProductId, setCreateProductId] = useState("");
  const [createName, setCreateName] = useState("");
  const [createSlug, setCreateSlug] = useState("");

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("product_translations")
      .select("*, product:products(model_number)")
      .eq("locale", locale)
      .order("name");
    setTranslations(data || []);
  }, [locale, supabase]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!supabase || !creating) return;
    supabase.from("products").select("id, model_number").order("model_number").then(({ data }: { data: any[] | null }) => setProducts(data || []));
  }, [supabase, creating]);

  function startEdit(t: any) {
    setEditing(t.id);
    setEditName(t.name);
    setEditSlug(t.slug);
    setEditDesc(t.description || "");
    setEditMetaTitle(t.meta_title || "");
    setEditMetaDesc(t.meta_description || "");
    setEditOgImage(t.og_image || "");
  }

  async function saveEdit(id: string) {
    if (!editName || !editSlug || !supabase) return;
    await supabase.from("product_translations").update({
      name: editName, slug: editSlug, description: editDesc,
      meta_title: editMetaTitle, meta_description: editMetaDesc, og_image: editOgImage,
    }).eq("id", id);
    setEditing(null);
    load();
  }

  async function deleteTranslation(id: string) {
    if (!confirm("Delete this translation?") || !supabase) return;
    await supabase.from("product_translations").delete().eq("id", id);
    load();
  }

  async function createTranslation() {
    if (!createName || !createSlug || !createProductId || !supabase) return;
    const { data: existing } = await supabase.from("product_translations").select("id").eq("locale", locale).eq("slug", createSlug);
    if (existing?.length) { alert(`Slug "${createSlug}" already exists.`); return; }
    await supabase.from("product_translations").insert({ product_id: createProductId, locale, name: createName, slug: createSlug });
    setCreating(false); setCreateProductId(""); setCreateName(""); setCreateSlug("");
    load();
  }

  async function uploadOgImage() {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0]; if (!file) return;
      const { compressImage } = await import("@/lib/image/compress");
      const compressed = await compressImage(file, 1200, 0.85);
      const fd = new FormData();
      fd.append("file", compressed, `og/${Date.now()}.webp`);
      fd.append("path", `og/${Date.now()}.webp`);
      fd.append("bucket", "products");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const result = await res.json();
      if (result.url) setEditOgImage(result.url);
    };
    input.click();
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-light tracking-wider text-white">🌐 Translations</h1>
          <div className="flex gap-2">
            {(["en", "zh"] as const).map((l) => (
              <button key={l} type="button" onClick={() => { setLocale(l); setEditing(null); }}
                className={`px-4 py-2 text-sm tracking-wider rounded-lg border transition-all ${
                  locale === l ? "bg-forest text-deep-dark border-forest" : "bg-transparent text-silver border-silver/30 hover:border-silver hover:text-white"
                }`}>{l === "en" ? "🇬🇧 English" : "🇨🇳 中文"}</button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <Button size="sm" onClick={() => setCreating(!creating)}>
            {creating ? "✕ Cancel" : `+ Add ${locale === "zh" ? "CN" : "EN"} Translation`}
          </Button>
          <span className="text-xs text-silver/40">{translations.length} translation(s)</span>
        </div>

        {creating && (
          <div className="bg-deep-blue/30 border border-forest/20 rounded-xl p-4 mb-6 space-y-2">
            <p className="text-xs text-forest/80 mb-2">New {locale === "zh" ? "Chinese" : "English"} Translation</p>
            <select value={createProductId} onChange={(e) => { setCreateProductId(e.target.value);
              const existing = translations.find((t: any) => t.product_id === e.target.value);
              if (existing) { setCreateName(existing.name); setCreateSlug(existing.slug); }
              else { setCreateName(""); setCreateSlug(""); }
            }} className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white">
              <option value="">Select product...</option>
              {products.map((p: any) => <option key={p.id} value={p.id}>{p.model_number}</option>)}
            </select>
            <input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="Name" className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white" />
            <input value={createSlug} onChange={(e) => setCreateSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))} placeholder="Slug" className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white font-mono" />
            <Button size="sm" onClick={createTranslation}>Create</Button>
          </div>
        )}

        <div className="bg-deep-blue/30 border border-silver/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-silver/10 text-silver/50 text-xs uppercase tracking-wider">
              <th className="text-left p-4">Product</th><th className="text-left p-4">Name</th><th className="text-left p-4">Slug</th>
              <th className="text-left p-4">Meta Title</th><th className="text-right p-4 w-32">Actions</th>
            </tr></thead>
            <tbody>
              {translations.map((t) => (
                <tr key={t.id} className="border-b border-silver/5 hover:bg-white/5 group">
                  {editing === t.id ? (
                    <>
                      <td className="p-4 text-white">{t.product?.model_number || "—"}</td>
                      <td className="p-4"><input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-deep-dark border border-silver/10 rounded px-2 py-1 text-xs text-white" /></td>
                      <td className="p-4"><input value={editSlug} onChange={(e) => setEditSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))} className="w-full bg-deep-dark border border-silver/10 rounded px-2 py-1 text-xs text-white font-mono" /></td>
                      <td className="p-4 text-silver/50 text-xs truncate max-w-[200px]">
                        <input value={editMetaTitle} onChange={(e) => setEditMetaTitle(e.target.value)} placeholder="Meta Title" className="w-full bg-deep-dark border border-silver/10 rounded px-2 py-1 text-xs text-white" />
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <button onClick={() => saveEdit(t.id)} className="text-forest hover:text-forest/80 text-xs mr-2">💾 Save</button>
                        <button onClick={() => setEditing(null)} className="text-silver/40 hover:text-white text-xs">✕</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-4 text-white">{t.product?.model_number || "—"}</td>
                      <td className="p-4 text-silver/80">{t.name}</td>
                      <td className="p-4 text-silver/60 font-mono text-xs">{t.slug}</td>
                      <td className="p-4 text-silver/50 text-xs truncate max-w-[200px]">{t.meta_title || "—"}</td>
                      <td className="p-4 text-right whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(t)} className="text-ice/60 hover:text-ice text-xs mr-3">✏️ Edit</button>
                        <button onClick={() => deleteTranslation(t.id)} className="text-red-400/60 hover:text-red-400 text-xs">🗑</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {translations.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-xs text-silver/40">No translations.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* SEO + Meta Fields (top panel when editing) */}
        {editing && (
          <div className="mt-6 bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
            <h3 className="text-white tracking-wide mb-4">🔍 SEO & Meta</h3>
            <div className="space-y-3 max-w-2xl">
              <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Description (shown on product page)"
                className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white" />
              <input value={editMetaTitle} onChange={(e) => setEditMetaTitle(e.target.value)}
                placeholder="Meta Title (browser tab / search result)"
                className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white" />
              <textarea value={editMetaDesc} onChange={(e) => setEditMetaDesc(e.target.value)} rows={2}
                placeholder="Meta Description (search snippet)"
                className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white" />
              <div className="flex gap-2 items-center">
                <input value={editOgImage} onChange={(e) => setEditOgImage(e.target.value)}
                  placeholder="OG Image URL (social share image)"
                  className="flex-1 bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white font-mono text-xs" />
                <Button size="sm" variant="outline" onClick={uploadOgImage}>📁</Button>
              </div>
              <p className="text-[10px] text-silver/40">OG Image is used when sharing on Facebook, LinkedIn, Twitter. If empty, the system auto-generates one.</p>
              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={() => saveEdit(editing)}>💾 Save All</Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
