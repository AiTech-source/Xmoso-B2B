"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Button from "@/components/ui/Button";

const PRODUCT_TYPES = ["Wine Coolers", "Cigar Cabinet", "Drinks Cooler", "Other"];

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "", inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; }
    else { current += ch; }
  }
  result.push(current.trim());
  return result;
}

export default function AdminSpecTemplatesPage() {
  const supabase = createClient();
  const [templates, setTemplates] = useState<any[]>([]);
  const [productType, setProductType] = useState("Wine Coolers");
  const [newLabel, setNewLabel] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);

  function loadTemplates(pt: string) {
    fetch(`/api/specs?product_type=${encodeURIComponent(pt)}`)
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates || []));
  }

  useEffect(() => { loadTemplates(productType); }, [productType]);

  async function addTemplate() {
    if (!newLabel || !supabase) return;
    await supabase.from("product_spec_templates").insert({
      product_type: productType,
      label: newLabel,
      sort_order: templates.length + 1,
    });
    setNewLabel("");
    loadTemplates(productType);
  }

  async function removeTemplate(id: string) {
    if (!supabase) return;
    await supabase.from("product_spec_templates").delete().eq("id", id);
    loadTemplates(productType);
  }

  function moveTemplate(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= templates.length) return;
    const updated = [...templates];
    [updated[i], updated[j]] = [updated[j], updated[i]];
    updated.forEach((t, idx) => { t.sort_order = idx + 1; saveSort(t.id, idx + 1); });
    setTemplates(updated);
  }

  async function saveSort(id: string, sort: number) {
    if (!supabase) return;
    await supabase.from("product_spec_templates").update({ sort_order: sort }).eq("id", id);
  }

  // ─── Download CSV template ───
  function downloadTemplate() {
    if (templates.length === 0) return;
    const headers = ["model_number", ...templates.map((t: any) => t.label)];
    const csv = headers.join(",") + "\n\n";
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${productType.replace(/\s+/g, "-")}-specs.csv`; a.click();
  }

  // ─── Upload CSV and batch import specs ───
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadResult("");

    try {
      const buf = await file.arrayBuffer();
      let text = new TextDecoder("utf-8", { fatal: false }).decode(buf);
      if (text.includes("�")) {
        const fallback = new TextDecoder("gbk", { fatal: false }).decode(buf);
        if (!fallback.includes("�")) text = fallback;
      }
      // Strip BOM
      text = text.replace(/^﻿/, "");

      const lines = text.split("\n").filter((l: string) => l.trim());
      if (lines.length < 2) { setUploadResult("❌ CSV has no data rows"); setUploading(false); return; }

      const headers = parseCSVLine(lines[0]);
      const specLabels = headers.slice(1).filter(Boolean); // first col is model_number
      if (specLabels.length === 0) { setUploadResult("❌ No spec columns found in CSV"); setUploading(false); return; }

      const sb = createClient();
      if (!sb) { setUploadResult("❌ Supabase client unavailable"); setUploading(false); return; }

      let updated = 0, errors = 0;
      for (let i = 1; i < lines.length; i++) {
        const vals = parseCSVLine(lines[i]);
        const modelNumber = vals[0]?.trim();
        if (!modelNumber) continue;

        // Find product by model_number
        const { data: products } = await sb.from("products").select("id").eq("model_number", modelNumber);
        if (!products || products.length === 0) { errors++; continue; }

        const productId = products[0].id;

        // Build spec rows from CSV columns
        const specRows: { product_id: string; label: string; value: string; sort_order: number }[] = [];
        specLabels.forEach((label: string, idx: number) => {
          const value = (vals[idx + 1] || "").trim();
          if (value) {
            specRows.push({ product_id: productId, label, value, sort_order: idx + 1 });
          }
        });

        if (specRows.length === 0) { errors++; continue; }

        // Delete old specs for this product then insert new ones
        await sb.from("product_specs").delete().eq("product_id", productId);
        const { error } = await sb.from("product_specs").insert(specRows);
        if (error) { errors++; } else { updated++; }
      }

      setUploadResult(`✅ ${updated} product(s) updated` + (errors ? `, ${errors} error(s)` : ""));
    } catch (err: any) {
      setUploadResult(`❌ ${err.message || "Upload failed"}`);
    }
    setUploading(false);
    if (uploadRef.current) uploadRef.current.value = "";
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-light tracking-wider text-white">📋 Spec Templates</h1>
        </div>
        <p className="text-xs text-silver/40 mb-6">
          Define which spec fields each product type should have. Then download the CSV template, fill in values for multiple models, and upload to batch-import.
        </p>

        {/* Product type tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {PRODUCT_TYPES.map((pt) => (
            <button key={pt} onClick={() => setProductType(pt)}
              className={`px-4 py-2 text-sm rounded-full border transition-colors ${productType === pt ? "bg-forest/20 text-forest border-forest/30" : "bg-transparent text-silver/50 border-silver/20 hover:text-white"}`}>
              {pt}
            </button>
          ))}
        </div>

        {/* Add new */}
        <div className="flex gap-3 mb-6">
          <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
            placeholder={`New spec label for ${productType}`}
            className="bg-deep-dark border border-silver/10 rounded-lg px-4 py-2 text-sm text-white flex-1" />
          <Button size="sm" onClick={addTemplate}>+ Add Spec</Button>
        </div>

        {/* Template list */}
        <div className="bg-deep-blue/30 border border-silver/10 rounded-xl overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-silver/10 text-silver/50 text-xs uppercase tracking-wider">
              <th className="text-left p-4 w-12">#</th><th className="text-left p-4">Spec Label</th><th className="text-right p-4 w-32">Actions</th>
            </tr></thead>
            <tbody>
              {templates.map((t, i) => (
                <tr key={t.id} className="border-b border-silver/5 hover:bg-white/5">
                  <td className="p-4 text-silver/40 text-xs">{t.sort_order}</td>
                  <td className="p-4 text-white">{t.label}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => moveTemplate(i, -1)} className="text-silver/40 hover:text-white text-xs px-2">↑</button>
                    <button onClick={() => moveTemplate(i, 1)} className="text-silver/40 hover:text-white text-xs px-2">↓</button>
                    <button onClick={() => removeTemplate(t.id)} className="text-red-400/60 hover:text-red-400 text-xs px-2">×</button>
                  </td>
                </tr>
              ))}
              {templates.length === 0 && (
                <tr><td colSpan={3} className="p-8 text-center text-xs text-silver/40">No spec templates yet. Add your first spec above.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bulk Export / Import */}
        {templates.length > 0 && (
          <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
            <h3 className="text-white tracking-wide mb-4">📦 Bulk Spec Import for <span className="text-ice">{productType}</span></h3>

            <div className="flex gap-3 mb-4">
              <Button size="sm" variant="outline" onClick={downloadTemplate}>
                📥 Download CSV Template
              </Button>
              <input type="file" accept=".csv" onChange={handleUpload} hidden ref={uploadRef} disabled={uploading} />
              <Button size="sm" variant="outline" onClick={() => uploadRef.current?.click()} disabled={uploading}>
                {uploading ? "⏳ Uploading..." : "📤 Upload CSV"}
              </Button>
            </div>

            {uploadResult && (
              <p className="text-sm mt-3" style={{ color: uploadResult.startsWith("✅") ? "#8BC8A0" : "#f87171" }}>{uploadResult}</p>
            )}

            <div className="mt-4 p-4 bg-deep-dark/40 border border-silver/10 rounded-xl">
              <p className="text-xs text-silver/50 uppercase tracking-wider mb-2">📄 CSV Format</p>
              <p className="text-xs text-silver/60 font-mono leading-loose">
                <span className="text-ice">model_number</span>,<span className="text-forest">{templates.map((t: any) => t.label).join(",")}</span><br />
                XBI70D,22,Freestanding,W595xD568xH590mm,28<br />
                XBI70DB,32,Built-in,W600xD600xH600mm,28<br />
                XBIU90D,28,Built-in/Built-under,W592xD568xH715mm,28<br />
              </p>
              <p className="text-xs text-silver/40 mt-2">
                First column is the product <span className="text-ice">model_number</span>. Remaining columns map to your spec labels above.<br />
                Existing specs for each product are replaced. Use double quotes if a value contains commas.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
