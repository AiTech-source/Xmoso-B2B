"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Button from "@/components/ui/Button";
import ImageUploader from "@/components/admin/ImageUploader";
import RichTextEditor from "@/components/admin/RichTextEditor";
import SpecTable from "@/components/products/SpecTable";
import { useUnsavedWarning } from "@/components/admin/useUnsavedWarning";

interface SpecRow {
  no?: number;
  label: string;
  value: string;
  bgColor?: string;
  fontSize?: string;
  color?: string;
  _highlight?: boolean;
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({ model_number: "", energy_rating: "", category_id: "", sort_order: 0, product_style: "" });
  const [categories, setCategories] = useState<any[]>([]);
  const [specs, setSpecs] = useState<SpecRow[]>([]);
  const [images, setImages] = useState<{url: string; alt: string}[]>([]);
  const [content, setContent] = useState<any>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [paramCounters, setParamCounters] = useState<any[]>([
    { label: "Temperature Range", value: "5-20", unit: "℃", icon: "🌡️" },
    { label: "Humidity Control", value: "50-80", unit: "%RH", icon: "💧" },
    { label: "Capacity", value: "168", unit: "bottles", icon: "🍾" },
  ]);
  const [ecoFeatures, setEcoFeatures] = useState<any[]>([
    { value: "A++", label: "Energy Rating", color: "ice" },
    { value: "0", label: "Ozone Depletion", color: "forest" },
    { value: "85%", label: "Recyclable", color: "ice" },
    { value: "✓", label: "RoHS Compliant", color: "forest" },
  ]);
  const [specTabs, setSpecTabs] = useState<any[]>([
    { id: "cooling", label: "Cooling Engine", content: "Dual-stage compressor system with natural refrigerant R290. Zero ozone depletion potential." },
    { id: "airflow", label: "Airflow Layout", content: "Tesla valve inspired airflow design ensures even temperature distribution across all shelves." },
    { id: "eco", label: "Eco Features", content: "Low-E double glazing · Vacuum insulation panels · 40% less energy than conventional units." },
  ]);
  const [installMedia, setInstallMedia] = useState<any[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contentLocale, setContentLocale] = useState("shared");
  const [localeContent, setLocaleContent] = useState<Record<string, any>>({});
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [relatedIds, setRelatedIds] = useState<string[]>([]);

  useUnsavedWarning(dirty);
  const markDirty = useCallback(() => setDirty(true), []);
  const [bulkText, setBulkText] = useState("");
  const [showBulk, setShowBulk] = useState(false);

  // Color presets for row backgrounds
  const colorOptions = [
    { label: "None", value: "" },
    { label: "Forest", value: "rgba(139, 200, 160, 0.1)" },
    { label: "Ice", value: "rgba(126, 200, 227, 0.1)" },
    { label: "Gold", value: "rgba(232, 200, 126, 0.12)" },
    { label: "Amber", value: "rgba(255, 193, 7, 0.1)" },
    { label: "Rose", value: "rgba(244, 67, 54, 0.08)" },
  ];

  useEffect(() => {
    supabase?.from("product_categories").select("*").order("sort_order").then(({ data }: { data: any[] | null }) => setCategories(data || []));
  }, []);

  useEffect(() => {
    if (!params.id) return;
    supabase?.from("products").select("*").eq("id", params.id).single()
      .then(({ data }: any) => {
        if (!data) return;
        setForm({
          model_number: data.model_number,
          energy_rating: data.energy_rating || "",
          category_id: data.category_id || "",
          sort_order: data.sort_order || 0,
          product_style: data.product_style || "",
        });
        // Load specs from new product_specs table
        supabase?.from("product_specs").select("label, value, sort_order, bg_color, font_size, color")
          .eq("product_id", params.id).order("sort_order", { ascending: true })
          .then(({ data: specData }: any) => {
            setSpecs((specData || []).map((s: any, i: number) => ({
              no: s.sort_order || i + 1,
              label: s.label,
              value: s.value,
              bgColor: s.bg_color || "",
              fontSize: s.font_size || "",
              color: s.color || "",
            })));
          });
        setImages(data.image_gallery?.map((g: any) => ({ url: g.url || g, alt: g.alt || "" })) || (data.images || []).map((u: string) => ({ url: u, alt: "" })));
        // Extract locale keys from DB content. The shape is:
        //   { blocks: [shared], _zh: { blocks: [...] }, _en: { blocks: [...] } }
        const dbContent = data.content || {};
        setContent(dbContent?.blocks ? { blocks: dbContent.blocks } : null);
        const map: Record<string, any> = { shared: dbContent?.blocks ? { blocks: dbContent.blocks } : null };
        if (dbContent._zh) map.zh = dbContent._zh;
        if (dbContent._en) map.en = dbContent._en;
        // Load legacy translation table content if any
        supabase?.from("product_translations").select("locale, content")
          .eq("product_id", params.id)
          .then(({ data: transData }: any) => {
            for (const t of transData || []) {
              if (t.content && !map[t.locale]) map[t.locale] = t.content;
            }
            setLocaleContent(map);
          });
        setHighlights(data.highlights || []);
        setParamCounters(data.param_counters?.length ? data.param_counters : [
          { label: "Temperature Range", value: "5-20", unit: "℃", icon: "🌡️" },
          { label: "Humidity Control", value: "50-80", unit: "%RH", icon: "💧" },
          { label: "Capacity", value: "168", unit: "bottles", icon: "🍾" },
        ]);
        setEcoFeatures(data.eco_features?.length ? data.eco_features : [
          { value: "A++", label: "Energy Rating", color: "ice" },
          { value: "0", label: "Ozone Depletion", color: "forest" },
          { value: "85%", label: "Recyclable", color: "ice" },
          { value: "✓", label: "RoHS Compliant", color: "forest" },
        ]);
        setInstallMedia(data.installation_media || []);
        setSpecTabs(data.spec_tabs?.length ? data.spec_tabs : [
          { id: "cooling", label: "Cooling Engine", content: "Dual-stage compressor system with natural refrigerant R290. Zero ozone depletion potential." },
          { id: "airflow", label: "Airflow Layout", content: "Tesla valve inspired airflow design ensures even temperature distribution across all shelves." },
          { id: "eco", label: "Eco Features", content: "Low-E double glazing · Vacuum insulation panels · 40% less energy than conventional units." },
        ]);
      });
  }, [params.id]);

  // Load all products for Related Products picker
  useEffect(() => {
    supabase?.from("products").select("id, model_number").order("model_number").then(({ data }: any) => setAllProducts(data || []));
  }, []);

  // Extract relatedProductIds from content when loaded
  useEffect(() => {
    if (params.id) {
      supabase?.from("products").select("content").eq("id", params.id).single().then(({ data }: any) => {
        if (data?.content?.relatedProductIds) setRelatedIds(data.content.relatedProductIds);
      });
    }
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);

    // Get old model_number to detect rename
    let oldModel = "";
    if (supabase) {
      const { data: old } = await supabase.from("products").select("model_number").eq("id", params.id).single();
      if (old) oldModel = old.model_number;
    }

    const payload: any = {
      ...form,
      image_gallery: images,
      highlights,
      param_counters: paramCounters,
      eco_features: ecoFeatures,
      spec_tabs: specTabs,
      installation_media: installMedia,
    };

    // Preserve DB content and add relatedProductIds
    const { data: cur } = await supabase
      ?.from("products").select("content").eq("id", params.id).single();
    payload.content = { ...(cur?.content || {}), relatedProductIds: relatedIds };

    await supabase?.from("products").update(payload).eq("id", params.id);
    setDirty(false);
    // Save specs to product_specs table
    if (supabase) {
      await supabase.from("product_specs").delete().eq("product_id", params.id);
      if (specs.length > 0) {
        await supabase.from("product_specs").insert(
          specs.map((s, i) => ({
            product_id: params.id,
            label: s.label,
            value: s.value,
            sort_order: i + 1,
            bg_color: s.bgColor || "",
            font_size: s.fontSize || "",
            color: s.color || "",
          }))
        );
      }

      // Sync translations if model_number changed
      if (oldModel && oldModel !== form.model_number && supabase) {
        const { data: translations } = await supabase
          .from("product_translations")
          .select("id, name, slug")
          .eq("product_id", params.id);
        for (const t of translations || []) {
          await supabase.from("product_translations").update({
            name: t.name.replace(oldModel, form.model_number),
            slug: t.slug.replace(oldModel.toLowerCase(), form.model_number.toLowerCase()),
          }).eq("id", t.id);
        }
      }
    }
    router.push("/admin/products");
  }

  // Bulk paste: parse "Label | Value" per line
  function handleBulkPaste() {
    const lines = bulkText.trim().split("\n").filter(Boolean);
    const parsed: SpecRow[] = lines.map((line, idx) => {
      const parts = line.split("|").map(s => s.trim());
      return {
        no: idx + 1,
        label: parts[0] || "",
        value: parts[1] || "",
        _highlight: false,
      };
    });
    setSpecs(parsed);
    setShowBulk(false);
    setBulkText("");
  }

  function autoNumber() {
    setSpecs(specs.map((s, i) => ({ ...s, no: i + 1 })));
  }

  function addSpec() {
    setSpecs([...specs, { label: "", value: "", no: specs.length + 1, _highlight: false }]);
  }

  function updateSpec(i: number, field: string, v: any) {
    const s = [...specs]; (s[i] as any)[field] = v; setSpecs(s);
  }

  function removeSpec(i: number) {
    setSpecs(specs.filter((_, idx) => idx !== i));
  }

  function moveSpec(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= specs.length) return;
    const s = [...specs];
    [s[i], s[j]] = [s[j], s[i]];
    setSpecs(s);
  }

  const saveContent = useCallback(async (c: any) => {
    // Read current DB content
    const { data: current } = await supabase
      ?.from("products").select("content").eq("id", params.id).single();
    const dbContent = current?.content || {};

    if (contentLocale === "shared") {
      // Only touch shared `blocks`, leave _zh/_en untouched
      const merged = { blocks: c?.blocks || [], _en: dbContent._en, _zh: dbContent._zh };
      await supabase?.from("products").update({ content: merged }).eq("id", params.id);
    } else {
      // Only touch locale key (_zh or _en), leave everything else
      const localeKey = `_${contentLocale}`;
      const merged = { ...dbContent, [localeKey]: c };
      await supabase?.from("products").update({ content: merged }).eq("id", params.id);
    }

    // Reload fresh DB state into content/localeContent
    const { data: reloaded } = await supabase
      ?.from("products").select("content").eq("id", params.id).single();
    const fresh = reloaded?.content || {};
    setContent(fresh?.blocks ? { blocks: fresh.blocks } : null);
    setLocaleContent({
      shared: fresh?.blocks ? { blocks: fresh.blocks } : null,
      zh: fresh._zh || null,
      en: fresh._en || null,
    });
  }, [params.id, contentLocale]);

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="ml-64 flex-1 p-8">
        <h1 className="text-2xl font-light tracking-wider text-white mb-8">Edit Product</h1>

        {/* Top save bar */}
        <div className="sticky top-0 z-20 -mx-8 px-8 py-3 bg-deep-blue/90 backdrop-blur-md border-b border-silver/10 flex items-center justify-between mb-6">
          <span className="text-xs text-silver/40">{dirty ? "⚠️ Unsaved changes" : "✅ All saved"}</span>
          <Button type="submit" disabled={saving} onClick={() => document.forms[0]?.requestSubmit()}>
            {saving ? "Saving..." : "💾 Save Product"}
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">

          {/* Basic fields */}
          <div className="grid grid-cols-2 gap-4">
            <input value={form.model_number} onChange={(e) => { setForm({ ...form, model_number: e.target.value }); markDirty(); }} required placeholder="Model Number" className="bg-deep-dark border border-silver/10 rounded-lg px-4 py-3 text-sm text-white" />
            <input value={form.energy_rating} onChange={(e) => { setForm({ ...form, energy_rating: e.target.value }); markDirty(); }} placeholder="Energy Rating" className="bg-deep-dark border border-silver/10 rounded-lg px-4 py-3 text-sm text-white" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="bg-deep-dark border border-silver/10 rounded-lg px-4 py-3 text-sm text-white">
              <option value="">No Category</option>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input value={form.product_style} onChange={(e) => setForm({ ...form, product_style: e.target.value })}
              placeholder="Product Style (e.g. Metal Type, Xmoso Type)"
              className="bg-deep-dark border border-silver/10 rounded-lg px-4 py-3 text-sm text-white" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
              placeholder="Sort Order" className="bg-deep-dark border border-silver/10 rounded-lg px-4 py-3 text-sm text-white" />
            <div></div>
          </div>

          {/* Related Products */}
          <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
            <h3 className="text-white tracking-wide mb-4">🔗 Related Products</h3>
            <p className="text-xs text-silver/50 mb-3">Select products that appear as "Related" on this product page. Leave empty for auto-suggest.</p>
            <div className="flex flex-wrap gap-2">
              {allProducts.filter((p: any) => p.id !== params.id).map((p: any) => {
                const selected = relatedIds.includes(p.id);
                return (
                  <button key={p.id} type="button" onClick={() => {
                    setRelatedIds(selected ? relatedIds.filter((id) => id !== p.id) : [...relatedIds, p.id]);
                    markDirty();
                  }}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                      selected ? "bg-forest/20 text-forest border-forest/30" : "bg-deep-dark text-silver/50 border-silver/20 hover:text-white"
                    }`}>
                    {p.model_number}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Images */}
          <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
            <h3 className="text-white tracking-wide mb-4">📸 Images</h3>
            <ImageUploader existing={images.map((i: any) => i.url || i)} onUploaded={(urls: string[]) => setImages(urls.map(u => ({ url: u, alt: "" })))}  />
            {images.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-[10px] text-silver/40 uppercase tracking-wider">Alt Text (SEO)</p>
                {images.map((img: any, i: number) => (
                  <div key={i} className="flex gap-2 items-center">
                    <img src={img.url || img} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                    <input value={img.alt || ""} onChange={(e) => {
                      const s = [...images]; s[i] = { ...s[i], alt: e.target.value }; setImages(s); markDirty();
                    }} placeholder="Alt text for search engines" className="flex-1 bg-deep-dark border border-silver/10 rounded px-3 py-2 text-xs text-white" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Highlights */}
          <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white tracking-wide">✨ Product Card Highlights</h3>
              <button type="button" onClick={() => setHighlights([...highlights, ""])}
                className="px-3 py-1 text-xs bg-forest/20 text-forest border border-forest/30 rounded hover:bg-forest/30 transition-colors">
                + Add Line
              </button>
            </div>
            <p className="text-xs text-silver/40 mb-3">These lines appear below the product image on the listing page.</p>

            {highlights.length > 0 && (
              <div className="mb-4 p-4 bg-deep-dark/40 border border-silver/10 rounded-xl">
                <p className="text-[10px] text-silver/40 uppercase tracking-wider mb-2">Preview:</p>
                <ul className="space-y-0.5">
                  {highlights.filter(Boolean).map((h, i) => (
                    <li key={i} className="text-[13px] text-silver/60 leading-relaxed">{h}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-2">
              {highlights.map((h, i) => (
                <div key={i} className="flex gap-2 items-center py-1 px-2 rounded hover:bg-white/5 transition-colors group">
                  <input value={h} onChange={(e) => { const s = [...highlights]; s[i] = e.target.value; setHighlights(s); }}
                    placeholder="e.g. 28 bottles capacity"
                    className="flex-1 bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white placeholder-silver/30" />
                  <button type="button" onClick={() => setHighlights(highlights.filter((_, idx) => idx !== i))}
                    className="text-red-400/60 hover:text-red-400 text-xs px-1 opacity-0 group-hover:opacity-100">×</button>
                </div>
              ))}
              {highlights.length === 0 && <p className="text-xs text-silver/40 py-3 text-center">No highlights set.</p>}
            </div>
          </div>

          {/* SPEC Table with bulk and styling */}
          <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <h3 className="text-white tracking-wide">📋 Specifications</h3>
                <span className="text-xs text-silver/40">({specs.length} rows)</span>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowBulk(!showBulk)}
                  className="px-3 py-1 text-xs bg-ice/20 text-ice border border-ice/30 rounded hover:bg-ice/30 transition-colors">
                  📥 Bulk Paste
                </button>
                <button type="button" onClick={autoNumber}
                  className="px-3 py-1 text-xs bg-forest/20 text-forest border border-forest/30 rounded hover:bg-forest/30 transition-colors">
                  # Auto Number
                </button>
                <button type="button" onClick={addSpec}
                  className="px-3 py-1 text-xs bg-forest/20 text-forest border border-forest/30 rounded hover:bg-forest/30 transition-colors">
                  + Add Row
                </button>
              </div>
            </div>

            {/* Bulk paste area */}
            {showBulk && (
              <div className="mb-4 p-4 bg-deep-dark/50 rounded-xl border border-ice/20">
                <p className="text-xs text-silver/50 mb-2">Paste rows — one per line: <code className="text-ice">Label | Value</code></p>
                <p className="text-xs text-silver/30 mb-3">Example: <br/>Cooling Type | Compressor<br/>Temperature Range | -2℃ ~ 8℃<br/>Power Supply | AC 220V/50Hz</p>
                <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} rows={8}
                  className="w-full bg-deep-dark border border-silver/10 rounded-lg px-4 py-3 text-sm text-white font-mono focus:border-forest/50 focus:outline-none"
                  placeholder={`Cooling Type | Compressor\nTemperature Range | -2℃ ~ 8℃\nPower Supply | AC 220V/50Hz\nNet Weight | 85kg`} />
                <div className="flex gap-2 mt-2">
                  <button type="button" onClick={handleBulkPaste}
                    className="px-4 py-1.5 bg-ice text-deep-dark text-xs font-medium rounded hover:bg-ice/90 transition-colors">
                    ✅ Apply
                  </button>
                  <button type="button" onClick={() => setShowBulk(false)}
                    className="px-4 py-1.5 text-xs text-silver/50 border border-silver/20 rounded hover:text-white transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Live preview */}
            {specs.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-silver/40 mb-2">Preview:</p>
                <SpecTable specs={specs} />
              </div>
            )}

            {/* Row editor */}
            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {specs.map((spec, i) => (
                <div key={i} className="flex gap-1.5 items-start py-1.5 px-2 rounded hover:bg-white/5 transition-colors group">
                  {/* No. */}
                  <input type="number" value={spec.no || i + 1}
                    onChange={(e) => updateSpec(i, "no", parseInt(e.target.value) || 0)}
                    className="w-10 bg-deep-dark border border-silver/10 rounded px-1 py-2 text-xs text-silver/50 text-center" min={0} />

                  {/* Label */}
                  <input value={spec.label} onChange={(e) => updateSpec(i, "label", e.target.value)}
                    placeholder="Label"
                    className="flex-[2] bg-deep-dark border border-silver/10 rounded px-2 py-2 text-xs text-white placeholder-silver/30" />

                  {/* Value */}
                  <input value={spec.value} onChange={(e) => updateSpec(i, "value", e.target.value)}
                    placeholder="Value"
                    className="flex-[3] bg-deep-dark border border-silver/10 rounded px-2 py-2 text-xs text-white placeholder-silver/30" />

                  {/* BG Color */}
                  <select value={spec.bgColor || ""} onChange={(e) => updateSpec(i, "bgColor", e.target.value)}
                    className="w-20 bg-deep-dark border border-silver/10 rounded px-1 py-2 text-xs text-silver/60">
                    {colorOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>

                  {/* Font Size */}
                  <select value={spec.fontSize || ""} onChange={(e) => updateSpec(i, "fontSize", e.target.value)}
                    className="w-14 bg-deep-dark border border-silver/10 rounded px-1 py-2 text-xs text-silver/60">
                    <option value="">Auto</option>
                    <option value="11">11px</option>
                    <option value="12">12px</option>
                    <option value="13">13px</option>
                    <option value="14">14px</option>
                    <option value="15">15px</option>
                    <option value="16">16px</option>
                    <option value="18">18px</option>
                  </select>

                  {/* Text Color */}
                  <input type="color" value={spec.color || "#ffffff"}
                    onChange={(e) => updateSpec(i, "color", e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0" />

                  {/* Move up/down */}
                  <button type="button" onClick={() => moveSpec(i, -1)} className="text-silver/30 hover:text-white text-xs px-1 opacity-0 group-hover:opacity-100">↑</button>
                  <button type="button" onClick={() => moveSpec(i, 1)} className="text-silver/30 hover:text-white text-xs px-1 opacity-0 group-hover:opacity-100">↓</button>

                  {/* Delete */}
                  <button type="button" onClick={() => removeSpec(i)} className="text-red-400/60 hover:text-red-400 text-xs px-1">×</button>
                </div>
              ))}
              {specs.length === 0 && <p className="text-xs text-silver/40 py-4 text-center">No specs yet. Use "Bulk Paste" above to import, or add one by one.</p>}
            </div>
          </div>

          {/* Param Counters */}
          <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white tracking-wide">📊 Parameter Counters</h3>
              <button type="button" onClick={() => setParamCounters([...paramCounters, { label: "", value: 0, unit: "", icon: "📊" }])}
                className="px-3 py-1 text-xs bg-forest/20 text-forest border border-forest/30 rounded hover:bg-forest/30 transition-colors">
                + Add Counter
              </button>
            </div>

            {/* Live preview */}
            {paramCounters.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-4">
                {paramCounters.map((pc, i) => (
                  <div key={i} className="text-center p-4 bg-deep-blue/40 border border-silver/10 rounded-xl">
                    <span className="text-2xl">{pc.icon}</span>
                    <div className="mt-2"><span className="text-2xl font-light text-ice">{pc.value}</span><span className="text-sm text-silver/60 ml-1">{pc.unit}</span></div>
                    <p className="text-[10px] text-silver/50 mt-1 uppercase tracking-wider">{pc.label}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              {paramCounters.map((pc, i) => (
                <div key={i} className="flex gap-2 items-center py-1.5 px-2 rounded hover:bg-white/5 transition-colors group">
                  <input value={pc.icon} onChange={(e) => { const s = [...paramCounters]; s[i] = { ...s[i], icon: e.target.value }; setParamCounters(s); }}
                    className="w-10 text-center bg-deep-dark border border-silver/10 rounded px-1 py-2 text-sm" />
                  <input value={pc.label} onChange={(e) => { const s = [...paramCounters]; s[i] = { ...s[i], label: e.target.value }; setParamCounters(s); }}
                    placeholder="Label" className="flex-1 bg-deep-dark border border-silver/10 rounded px-2 py-2 text-xs text-white placeholder-silver/30" />
                  <input value={pc.value} onChange={(e) => { const s = [...paramCounters]; s[i] = { ...s[i], value: e.target.value }; setParamCounters(s); }}
                    className="w-24 bg-deep-dark border border-silver/10 rounded px-2 py-2 text-xs text-white text-center font-mono" />
                  <input value={pc.unit} onChange={(e) => { const s = [...paramCounters]; s[i] = { ...s[i], unit: e.target.value }; setParamCounters(s); }}
                    placeholder="Unit" className="w-16 bg-deep-dark border border-silver/10 rounded px-2 py-2 text-xs text-white placeholder-silver/30 text-center" />
                  <button type="button" onClick={() => { setParamCounters(paramCounters.filter((_, idx) => idx !== i)); }}
                    className="text-red-400/60 hover:text-red-400 text-xs px-1 opacity-0 group-hover:opacity-100">×</button>
                </div>
              ))}
            </div>
          </div>

          {/* Spec Tabs */}
          <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white tracking-wide">📑 Product Tabs</h3>
              <button type="button" onClick={() => {
                const id = "tab-" + Date.now();
                setSpecTabs([...specTabs, { id, label: "New Tab", content: "" }]);
              }}
                className="px-3 py-1 text-xs bg-forest/20 text-forest border border-forest/30 rounded hover:bg-forest/30 transition-colors">
                + Add Tab
              </button>
            </div>

            <div className="space-y-3">
              {specTabs.map((tab, i) => (
                <div key={tab.id} className="p-3 bg-deep-dark/40 border border-silver/10 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <input value={tab.label} onChange={(e) => { const s = [...specTabs]; s[i] = { ...s[i], label: e.target.value }; setSpecTabs(s); }}
                      placeholder="Tab Label" className="flex-1 bg-deep-dark border border-silver/10 rounded px-2 py-1.5 text-xs text-white placeholder-silver/30" />
                    <span className="text-[10px] text-silver/30 font-mono">{tab.id}</span>
                    <button type="button" onClick={() => { setSpecTabs(specTabs.filter((_, idx) => idx !== i)); }}
                      className="text-red-400/60 hover:text-red-400 text-xs px-1">×</button>
                  </div>
                  <textarea value={tab.content} onChange={(e) => { const s = [...specTabs]; s[i] = { ...s[i], content: e.target.value }; setSpecTabs(s); }}
                    rows={2} placeholder="Tab content..." className="w-full bg-deep-dark border border-silver/10 rounded px-2 py-1.5 text-xs text-white placeholder-silver/30" />
                </div>
              ))}
              {specTabs.length === 0 && <p className="text-xs text-silver/40 py-4 text-center">No tabs yet. Click "Add Tab" to create one.</p>}
            </div>
          </div>

          {/* Installation Media */}
          <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-white tracking-wide">📐 Installation Resources</h3>
              <div className="flex gap-2">
                <label className="px-3 py-1 text-xs bg-forest/20 text-forest border border-forest/30 rounded hover:bg-forest/30 transition-colors cursor-pointer">
                  📷 Image
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0]; if (!file) return;
                    try {
                      const { compressImage } = await import("@/lib/image/compress");
                      const compressed = await compressImage(file, 1920, 0.85);
                      const path = `install/${Date.now()}.webp`;
                      const formData = new FormData();
                      formData.append("file", compressed, `${path}.webp`);
                      formData.append("path", path); formData.append("bucket", "products");
                      const res = await fetch("/api/upload", { method: "POST", body: formData });
                      const result = await res.json();
                      if (result.url) setInstallMedia([...installMedia, { type: "image", url: result.url, label: file.name.replace(/\.[^.]+$/, "") }]);
                    } catch(e: any) { alert(e.message); }
                    e.target.value = "";
                  }} />
                </label>
                <label className="px-3 py-1 text-xs bg-ice/20 text-ice border border-ice/30 rounded hover:bg-ice/30 transition-colors cursor-pointer">
                  📄 PDF
                  <input type="file" accept=".pdf" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0]; if (!file) return;
                    try {
                      const path = `install/${Date.now()}-${file.name}`;
                      const formData = new FormData();
                      formData.append("file", file, file.name);
                      formData.append("path", path); formData.append("bucket", "products");
                      const res = await fetch("/api/upload", { method: "POST", body: formData });
                      const result = await res.json();
                      if (result.url) setInstallMedia([...installMedia, { type: "pdf", url: result.url, label: file.name.replace(/\.[^.]+$/, "") }]);
                    } catch(e: any) { alert(e.message); }
                    e.target.value = "";
                  }} />
                </label>
              </div>
            </div>
            <p className="text-xs text-silver/40 mb-3">Upload images/PDFs directly, or paste URLs for videos.</p>
            <div className="space-y-2">
              {installMedia.map((item: any, i: number) => (
                <div key={i} className="flex gap-2 items-center">
                  <select value={item.type || "image"} onChange={(e) => {
                    const s = [...installMedia]; s[i] = { ...s[i], type: e.target.value }; setInstallMedia(s);
                  }} className="bg-deep-dark border border-silver/10 rounded px-2 py-2 text-xs text-silver/60">
                    <option value="image">Image</option>
                    <option value="pdf">PDF</option>
                    <option value="video">Video</option>
                  </select>
                  <input value={item.label || ""} onChange={(e) => {
                    const s = [...installMedia]; s[i] = { ...s[i], label: e.target.value }; setInstallMedia(s);
                  }} placeholder="Label" className="w-32 bg-deep-dark border border-silver/10 rounded px-2 py-2 text-xs text-white" />
                  <input value={item.url || ""} onChange={(e) => {
                    const s = [...installMedia]; s[i] = { ...s[i], url: e.target.value }; setInstallMedia(s);
                  }} placeholder="URL" className="flex-1 bg-deep-dark border border-silver/10 rounded px-2 py-2 text-xs text-white font-mono" />
                  <button onClick={() => setInstallMedia(installMedia.filter((_: any, idx: number) => idx !== i))}
                    className="text-red-400/60 hover:text-red-400 text-xs">×</button>
                </div>
              ))}
              <button onClick={() => setInstallMedia([...installMedia, { type: "image", url: "", label: "" }])}
                className="text-xs text-ice/60 hover:text-ice">+ Add Resource</button>
            </div>
          </div>

          {/* Eco Features */}
          <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white tracking-wide">🌱 Sustainability</h3>
              <button type="button" onClick={() => setEcoFeatures([...ecoFeatures, { value: "", label: "", color: "forest" }])}
                className="px-3 py-1 text-xs bg-forest/20 text-forest border border-forest/30 rounded hover:bg-forest/30 transition-colors">
                + Add Item
              </button>
            </div>

            {/* Live preview */}
            {ecoFeatures.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center mb-4 p-6 bg-deep-blue/20 border border-forest/20 rounded-xl">
                {ecoFeatures.map((f: any, i: number) => (
                  <div key={i}>
                    <span className={`text-2xl font-light ${f.color === "forest" ? "text-forest" : "text-ice"}`}>{f.value}</span>
                    <p className="text-xs text-silver/50 mt-1">{f.label}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              {ecoFeatures.map((f: any, i: number) => (
                <div key={i} className="flex gap-2 items-center py-1.5 px-2 rounded hover:bg-white/5 transition-colors group">
                  <input value={f.value} onChange={(e) => { const s = [...ecoFeatures]; s[i] = { ...s[i], value: e.target.value }; setEcoFeatures(s); }}
                    placeholder="Value (e.g. A++)" className="w-20 bg-deep-dark border border-silver/10 rounded px-2 py-2 text-xs text-white placeholder-silver/30 text-center" />
                  <input value={f.label} onChange={(e) => { const s = [...ecoFeatures]; s[i] = { ...s[i], label: e.target.value }; setEcoFeatures(s); }}
                    placeholder="Label" className="flex-1 bg-deep-dark border border-silver/10 rounded px-2 py-2 text-xs text-white placeholder-silver/30" />
                  <select value={f.color} onChange={(e) => { const s = [...ecoFeatures]; s[i] = { ...s[i], color: e.target.value }; setEcoFeatures(s); }}
                    className="w-20 bg-deep-dark border border-silver/10 rounded px-2 py-2 text-xs text-silver/60">
                    <option value="ice">Ice Blue</option>
                    <option value="forest">Forest Green</option>
                  </select>
                  <button type="button" onClick={() => setEcoFeatures(ecoFeatures.filter((_: any, idx: number) => idx !== i))}
                    className="text-red-400/60 hover:text-red-400 text-xs px-1 opacity-0 group-hover:opacity-100">×</button>
                </div>
              ))}
            </div>
          </div>

          {/* Rich Content */}
          <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-white tracking-wide">📝 Rich Content</h3>
              {/* Locale tabs */}
              <div className="flex gap-1 bg-deep-dark/60 rounded-lg p-0.5">
                {(["shared", "zh"] as const).map((l) => (
                  <button key={l} type="button" onClick={() => {
                    setContentLocale(l);
                    if (l === "shared") {
                      // Strip locale keys (_zh/_en) from content before passing to editor
                      const shared = localeContent["shared"];
                      setContent(shared?.blocks ? { blocks: shared.blocks } : shared);
                    } else {
                      setContent(localeContent[l] || null);
                    }
                  }}
                    className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                      contentLocale === l
                        ? "bg-forest/20 text-forest"
                        : "text-silver/50 hover:text-white"
                    }`}>
                    {l === "shared" ? "📁 Shared" : "🇨🇳 CN"}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-silver/40 mb-4">
              {contentLocale === "shared"
                ? "Shared content — shown for all languages unless CN override exists."
                : "Editing Chinese content — overrides Shared content for CN visitors."}
            </p>
            <RichTextEditor key={contentLocale} content={content} onSave={saveContent} />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "💾 Save Product"}</Button>
            <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>Cancel</Button>
          </div>
        </form>
      </main>
    </div>
  );
}
