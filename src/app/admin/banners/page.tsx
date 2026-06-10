"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { compressImage } from "@/lib/image/compress";

const PAGES = [
  { key: "home", label: "🏠 Home" },
  { key: "products", label: "📦 Products" },
  { key: "product-detail", label: "📄 Product Detail" },
  { key: "about", label: "ℹ️ About" },
  { key: "contact", label: "✉️ Contact" },
];

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [pageKey, setPageKey] = useState("home");
  const [uploading, setUploading] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  function loadBanners(page: string) {
    fetch(`/api/banners?page=${page}`)
      .then((r) => r.json())
      .then((data) => setBanners(data.banners || []));
  }

  useEffect(() => { loadBanners(pageKey); }, [pageKey]);

  function detectOrientation(file: File): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.naturalWidth >= img.naturalHeight ? "landscape" : "portrait");
      img.onerror = () => resolve("landscape");
      img.src = URL.createObjectURL(file);
    });
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0 || !supabase) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      try {
        const orientation = await detectOrientation(file);
        const compressed = await compressImage(file, 1920, 0.85);
        const path = `banners/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
        const formData = new FormData();
        formData.append("file", compressed, `banner.webp`);
        formData.append("path", path);
        formData.append("bucket", "products");
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const result = await uploadRes.json();
        if (result.error) { console.error(result.error); continue; }
        if (result.url) {
          await supabase.from("page_banners").insert({
            page_key: pageKey,
            image_url: result.url,
            alt_text: file.name.replace(/\.[^.]+$/, ""),
            sort_order: banners.length + 1,
            orientation,
          });
        }
      } catch (e) { console.error(e); }
    }
    setUploading(false);
    loadBanners(pageKey);
  }

  async function deleteBanner(id: string) {
    if (!supabase) return;
    await supabase.from("page_banners").delete().eq("id", id);
    loadBanners(pageKey);
  }

  async function updateField(id: string, field: string, value: string) {
    if (!supabase) return;
    await supabase.from("page_banners").update({ [field]: value }).eq("id", id);
  }

  function handleDragStart(i: number) { setDragIdx(i); }
  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) return;
    const reordered = [...banners];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(i, 0, moved);
    reordered.forEach((b, idx) => b.sort_order = idx + 1);
    setBanners(reordered);
    setDragIdx(i);
  }
  async function handleDragEnd() {
    setDragIdx(null);
    if (!supabase) return;
    for (const b of banners) {
      await supabase.from("page_banners").update({ sort_order: b.sort_order }).eq("id", b.id);
    }
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="ml-64 flex-1 p-8">
        <h1 className="text-2xl font-light tracking-wider text-white mb-6">🎠 Page Banners</h1>

        {/* Page selector */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {PAGES.map((p) => (
            <button key={p.key} onClick={() => setPageKey(p.key)}
              className={`px-4 py-2 text-sm rounded-full border transition-colors ${
                pageKey === p.key ? "bg-forest/20 text-forest border-forest/30" : "bg-transparent text-silver/50 border-silver/20 hover:text-white"
              }`}>{p.label}</button>
          ))}
        </div>

        {/* Upload */}
        <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6 mb-6">
          <div onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-silver/20 rounded-xl py-6 text-center cursor-pointer hover:border-forest/50 transition-colors">
            {uploading ? (
              <p className="text-silver/60 text-sm">⏳ Uploading...</p>
            ) : (
              <>
                <p className="text-silver/60 text-sm">📁 Upload images for <span className="text-ice font-medium">{PAGES.find(p => p.key === pageKey)?.label}</span></p>
                <p className="text-xs text-silver/40 mt-1">Auto-compressed to WebP · Landscape recommended</p>
              </>
            )}
            <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
          </div>
        </div>

        {/* Banner list */}
        {banners.length === 0 ? (
          <div className="bg-deep-blue/20 border border-silver/10 rounded-xl p-12 text-center">
            <span className="text-4xl text-silver/20">🖼</span>
            <p className="text-silver/40 text-sm mt-4">No banners for this page yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-silver/40">{banners.length} banner(s) — drag to reorder</p>
            {banners.map((b, i) => (
              <div key={b.id}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDragEnd={handleDragEnd}
                className={`flex gap-4 bg-deep-blue/30 border rounded-xl p-4 transition-all cursor-grab active:cursor-grabbing ${
                  dragIdx === i ? "border-forest/50 opacity-60 scale-[1.02]" : "border-silver/10 hover:border-silver/20"
                }`}
              >
                <div className="w-48 h-28 rounded-lg overflow-hidden bg-deep-dark flex-shrink-0">
                  {b.image_url ? (
                    <img src={b.image_url} alt={b.alt_text} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-silver/20 text-2xl">🖼</div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input value={b.alt_text || ""} onChange={(e) => {
                    const s = [...banners]; s[i].alt_text = e.target.value; setBanners(s);
                    clearTimeout((b as any)._timer); (b as any)._timer = setTimeout(() => updateField(b.id, "alt_text", e.target.value), 500);
                  }} placeholder="Alt text" className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white placeholder-silver/30" />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-silver/30">#{b.sort_order}</span>
                    <button onClick={() => deleteBanner(b.id)}
                      className="text-red-400/60 hover:text-red-400 text-xs px-2 py-1 ml-auto">🗑 Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
