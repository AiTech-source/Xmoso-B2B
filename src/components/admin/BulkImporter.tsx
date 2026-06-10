"use client";
import { useState, useRef } from "react";
import JSZip from "jszip";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";

const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

// CSV line parser that respects double-quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseModelNumber(filename: string): { model: string; role: string } {
  const name = filename.replace(/\.[^.]+$/, ""); // strip extension
  // Try "MODEL-role" pattern: last dash separates role
  const dashIdx = name.lastIndexOf("-");
  if (dashIdx > 0) {
    const model = name.slice(0, dashIdx);
    const role = name.slice(dashIdx + 1);
    if (role.length <= 20 && role.length > 0) return { model, role };
  }
  return { model: name, role: "main" };
}

export default function BulkImporter() {
  const [csvUploading, setCsvUploading] = useState(false);
  const [zipUploading, setZipUploading] = useState(false);
  const [result, setResult] = useState("");
  const [zipResult, setZipResult] = useState("");
  const csvRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Resolve category slug → UUID on first use, then cache
  async function resolveCategoryId(slugOrId: string): Promise<string | null> {
    if (!slugOrId) return null;
    // Already a UUID? return as-is
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId)) return slugOrId;
    // Look up by slug
    const sb = createClient();
    if (!sb) return null;
    const { data } = await sb.from("product_categories").select("id").eq("slug", slugOrId).maybeSingle();
    return data?.id || null;
  }

  // ── CSV Import ──
  async function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvUploading(true);
    setResult("");
    try {
      const sb = createClient();
      if (!sb) { setResult("❌ Supabase client not available — check env vars"); setCsvUploading(false); return; }

      // Read as ArrayBuffer to handle non-UTF-8 encodings (common on Chinese Windows)
      const buf = await file.arrayBuffer();
      // Try UTF-8 first; if it has replacement chars, fall back to GBK
      let text = new TextDecoder("utf-8", { fatal: false }).decode(buf);
      if (text.includes("�")) {
        // Fallback: try GBK (common Excel export encoding on Chinese Windows)
        const fallback = new TextDecoder("gbk", { fatal: false }).decode(buf);
        if (!fallback.includes("�")) text = fallback;
      }
      const lines = text.split("\n").filter(Boolean);
      const headers = parseCSVLine(lines[0]);
      if (headers.length === 0 || headers[0] === "") { setResult("❌ CSV appears empty — check file format"); setCsvUploading(false); return; }

      let created = 0;
      const errors: string[] = [];
      for (let i = 1; i < lines.length; i++) {
        const vals = parseCSVLine(lines[i]);
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => row[h] = vals[idx] || "");
        if (!row.model_number) { errors.push(`Row ${i}: missing model_number`); continue; }

        // Resolve category slug → UUID if needed
        let catId: string | null = null;
        if (row.category_id) {
          catId = await resolveCategoryId(row.category_id);
          if (!catId) console.warn(`Category "${row.category_id}" not found, skipping`);
        }

        const { error } = await sb.from("products").upsert({
          model_number: row.model_number,
          energy_rating: row.energy_rating,
          category_id: catId,
          sort_order: parseInt(row.sort_order) || 0,
          specifications: {},
          highlights: row.highlights ? row.highlights.split("|").map((h: string) => h.trim()).filter(Boolean) : [],
          product_style: row.product_style || "",
        }, { onConflict: "model_number", ignoreDuplicates: false });
        if (error) {
          errors.push(`Row ${i} (${row.model_number}): ${error.message}`);
        } else {
          // Get product ID
          const { data: prod } = await sb.from("products").select("id").eq("model_number", row.model_number).single();
          if (prod) {
            // Auto-create EN/ZH translations
            const model = row.model_number;
            const slugBase = model.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
            const { count: enCount } = await sb.from("product_translations").select("*", { count: "exact", head: true }).eq("product_id", prod.id).eq("locale", "en");
            if (!enCount) {
              await sb.from("product_translations").insert({ product_id: prod.id, locale: "en", slug: slugBase + "-wine-cooler", name: model + " Wine Cooler", description: "" });
            }
            const { count: zhCount } = await sb.from("product_translations").select("*", { count: "exact", head: true }).eq("product_id", prod.id).eq("locale", "zh");
            if (!zhCount) {
              await sb.from("product_translations").insert({ product_id: prod.id, locale: "zh", slug: slugBase + "-wine-cooler-cn", name: model + " 恒温酒柜", description: "" });
            }

            // Parse specs from CSV: "Model|XBI70D|Capacity|28 bottles|..."
            if (row.specs) {
              const pairs = row.specs.split("|").map((s: string) => s.trim());
              const specRows: { label: string; value: string }[] = [];
              for (let si = 0; si < pairs.length - 1; si += 2) {
                if (pairs[si]) specRows.push({ label: pairs[si], value: pairs[si + 1] || "" });
              }
              // Delete old specs for this product
              await sb.from("product_specs").delete().eq("product_id", prod.id);
              // Insert new specs
              if (specRows.length > 0) {
                await sb.from("product_specs").insert(
                  specRows.map((s, idx) => ({ product_id: prod.id, label: s.label, value: s.value, sort_order: idx + 1 }))
                );
              }
            }
          }
          created++;
        }
      }

      const summary = `✅ Imported ${created}/${lines.length - 1} products`;
      setResult(errors.length > 0 ? summary + `\n⚠️ ${errors.length} error(s):\n` + errors.slice(0, 5).join("\n") : summary);
    } catch (err: any) {
      setResult(`❌ ${err.message || "CSV parse failed"}`);
    }
    setCsvUploading(false);
    if (csvRef.current) csvRef.current.value = "";
  }

  // ── ZIP Import (extract + group by model_number → update image_gallery) ──
  async function handleZIP(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setZipUploading(true);
    setZipResult("");
    try {
      const sb = createClient();
      if (!sb) { setZipResult("❌ Supabase client not available"); setZipUploading(false); return; }

      const zip = await JSZip.loadAsync(file);
      // Group entries by model number
      const groups: Record<string, { name: string; blob: Blob }[]> = {};
      const imageEntries: { name: string; blob: Blob }[] = [];

      for (const [filename, entry] of Object.entries(zip.files)) {
        if (entry.dir) continue;
        const ext = "." + filename.split(".").pop()?.toLowerCase();
        if (!ALLOWED_EXT.has(ext)) continue;
        const blob = await entry.async("blob");
        imageEntries.push({ name: filename, blob });
        const { model, role } = parseModelNumber(filename);
        if (!groups[model]) groups[model] = [];
        groups[model].push({ name: filename, blob });
      }

      if (imageEntries.length === 0) {
        setZipResult("⚠️ No valid image files found in ZIP");
        setZipUploading(false);
        return;
      }

      let updated = 0;
      let uploadedCount = 0;
      let errors: string[] = [];

      for (const [model, files] of Object.entries(groups)) {
        // Find product by model_number
        const { data: products } = await sb
          .from("products")
          .select("id")
          .eq("model_number", model);

        if (!products || products.length === 0) continue;

        const productId = products[0].id;
        const gallery: { url: string; alt: string }[] = [];

        // Sort files: main image (exact model match) first, then by name
        const sortedFiles = [...files].sort((a, b) => {
          const aMain = a.name.replace(/\.[^.]+$/, "") === model ? 0 : 1;
          const bMain = b.name.replace(/\.[^.]+$/, "") === model ? 0 : 1;
          if (aMain !== bMain) return aMain - bMain;
          return a.name.localeCompare(b.name);
        });

        for (const f of sortedFiles) {
          // Upload via server API (bypasses RLS with service_role key)
          const formData = new FormData();
          formData.append("file", f.blob, f.name);
          formData.append("path", `products/${model}/${f.name}`);
          formData.append("bucket", "products");

          const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
          const uploadResult = await uploadRes.json();

          if (uploadResult.error) {
            errors.push(`${f.name}: ${uploadResult.error}`);
            continue;
          }

          gallery.push({ url: uploadResult.url, alt: `${model} - ${f.name}` });
          uploadedCount++;
        }

        if (gallery.length > 0) {
          // Merge with existing gallery (append, don't replace)
          const { data: existing } = await sb
            .from("products")
            .select("image_gallery")
            .eq("id", productId)
            .single();

          const existingGallery = (existing?.image_gallery || []) as { url: string; alt: string }[];
          const merged = [...existingGallery, ...gallery];

          // Deduplicate by URL
          const seen = new Set<string>();
          const deduped = merged.filter(g => {
            if (seen.has(g.url)) return false;
            seen.add(g.url);
            return true;
          });

          const { error: updateErr } = await sb
            .from("products")
            .update({ image_gallery: deduped })
            .eq("id", productId);

          if (!updateErr) updated++;
        }
      }

      const summary = `✅ Uploaded ${uploadedCount} images, linked to ${updated} product(s)` +
        (imageEntries.length !== uploadedCount ? ` (${imageEntries.length - uploadedCount} skipped)` : "");
      setZipResult(errors.length > 0 ? summary + `\n⚠️ ${errors.slice(0, 5).join("\n")}` : summary);
    } catch (err: any) {
      setZipResult(`❌ ${err.message || "ZIP processing failed"}`);
    }
    setZipUploading(false);
    if (zipRef.current) zipRef.current.value = "";
  }

  function downloadTemplate() {
    const csv = "model_number,energy_rating,category_id,sort_order,highlights,product_style,specs\nWC-001,A++,bi-series,1,\"28 bottles|Freestanding\",\"Metal Type\",\"Model|WC-001|Capacity|28 bottles|Voltage|220V|Size|W592\"\nWC-002,A+,bu-series,2,\"168 bottles|Built-in\",\"Xmoso Type\",\"Model|WC-002|Capacity|168 bottles|Voltage|220V\"";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "product_template.csv"; a.click();
  }

  return (
    <div className="space-y-6">
      <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
        <h3 className="text-white tracking-wide mb-4">📄 CSV Import</h3>
        <p className="text-xs text-silver/50 mb-3">Upload CSV with columns: <span className="text-ice">model_number</span>, energy_rating, category_id (slug), sort_order, <span className="text-ice">highlights</span>, <span className="text-ice">product_style</span></p>
        <p className="text-xs text-silver/40 mb-4">Separate highlights with | pipe — put the column in double quotes if it contains commas: <span className="text-forest">{`"22 Bottles, Built-in|ERP Class F|Upper: 5-20°C"`}</span></p>
        <div className="flex gap-3">
          <input type="file" accept=".csv" onChange={handleCSV} hidden ref={csvRef} disabled={csvUploading} />
          <Button size="sm" variant="outline" disabled={csvUploading} onClick={() => csvRef.current?.click()}>
            {csvUploading ? "⏳ Importing..." : "📤 Upload CSV"}
          </Button>
          <Button size="sm" variant="ghost" onClick={downloadTemplate}>📥 Download Template</Button>
        </div>
        {result && <p className="text-sm mt-3" style={{ color: result.startsWith("✅") ? "#8BC8A0" : "#f87171" }}>{result}</p>}
      </div>

      <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
        <h3 className="text-white tracking-wide mb-4">📦 ZIP Image Import</h3>
        <div className="space-y-2 mb-3">
          <p className="text-xs text-silver/50">
            ZIP containing product images named by model number — e.g. <code className="text-ice">WC-001-main.jpg</code>, <code className="text-ice">WC-001-door.jpg</code>, <code className="text-ice">WC-001-side.jpg</code>
          </p>
          <p className="text-xs text-silver/40">
            ✓ Supported formats: JPG, PNG, WebP, AVIF<br />
            ✓ Filename convention: <code className="text-ice text-[10px]">{`{model_number}-{role}.{ext}`}</code> — images auto-grouped by model_number<br />
            ✓ Existing images are preserved (deduped by URL)
          </p>
        </div>
        <input type="file" accept=".zip,.rar,.7z" onChange={handleZIP} hidden ref={zipRef} disabled={zipUploading} />
        <Button size="sm" variant="outline" disabled={zipUploading} onClick={() => zipRef.current?.click()}>
          {zipUploading ? "⏳ Processing..." : "📤 Upload ZIP"}
        </Button>
        {zipResult && <p className="text-sm mt-3" style={{ color: zipResult.startsWith("✅") ? "#8BC8A0" : zipResult.startsWith("⚠️") ? "#e8c87e" : "#f87171" }}>{zipResult}</p>}
      </div>

      {/* Naming guide */}
      <div className="bg-deep-dark/50 border border-silver/10 rounded-xl p-5">
        <h4 className="text-xs text-silver/50 uppercase tracking-wider mb-3">📐 File Naming Convention</h4>
        <div className="text-xs text-silver/60 space-y-1 font-mono">
          <div><span className="text-ice">WC-001-main.jpg</span> → product <span className="text-forest">WC-001</span>, role: main</div>
          <div><span className="text-ice">WC-001-front-door.jpg</span> → product <span className="text-forest">WC-001</span>, role: front-door</div>
          <div><span className="text-ice">WC-001-side.jpg</span> → product <span className="text-forest">WC-001</span>, role: side</div>
          <div><span className="text-ice">WC-002-main.png</span> → product <span className="text-forest">WC-002</span>, role: main</div>
          <div className="text-silver/40">← 最后一个 <span className="text-ice text-[10px]">-</span> 前面的部分是 model_number</div>
        </div>
      </div>
    </div>
  );
}
