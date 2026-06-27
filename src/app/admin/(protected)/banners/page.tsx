"use client";
import { useEffect, useState, useRef } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";

const PAGES = [
  { key: "home", label: "Home" },
  { key: "products", label: "Products" },
  { key: "product-detail", label: "Product Detail" },
  { key: "about", label: "About" },
  { key: "contact", label: "Contact" },
  { key: "sourcing", label: "Sourcing" },
  { key: "sustainable", label: "Sustainable" },
];

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [pageKey, setPageKey] = useState("home");
  const [uploading, setUploading] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadId = useRef(0);

  function loadBanners(page: string) {
    fetch(`/api/banners?page=${page}&_=${Date.now()}&${Math.random()}`, { cache: "no-store", headers: { "Pragma": "no-cache" } })
      .then((r) => r.json())
      .then((data) => setBanners(data.banners || []));
  }

  useEffect(() => { loadBanners(pageKey); }, [pageKey]);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const errs: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("page_key", pageKey);
        const res = await fetch("/api/banner-upload", {
          method: "POST",
          body: fd,
          cache: "no-store",
        });
        const d = await res.json();
        if (!res.ok) { errs.push(d.error || "Upload failed"); }
      } catch (e: any) { errs.push(e.message); }
    }
    setUploading(false);
    if (errs.length > 0) alert("Errors:\n" + errs.join("\n"));
    loadBanners(pageKey);
  }

  async function deleteBanner(id: string) {
    try {
      const res = await fetch(`/api/banners?id=${id}&r=${Math.random()}`, {
        method: "DELETE",
        cache: "no-store",
      });
      if (res.ok) { loadBanners(pageKey); return; }
      const d = await res.json();
      alert("Delete HTTP " + res.status + ": " + (d.error || "Unknown"));
    } catch (e: any) { alert("Delete error: " + e.message); }
  }

  function handleDragStart(i: number) { setDragIdx(i); }
  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) return;
    const r = [...banners];
    const [m] = r.splice(dragIdx, 1);
    r.splice(i, 0, m);
    r.forEach((b, idx) => b.sort_order = idx + 1);
    setBanners(r);
    setDragIdx(i);
  }
  async function handleDragEnd() {
    setDragIdx(null);
    for (const b of banners) {
      await fetch("/api/banners", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: b.id, sort_order: b.sort_order }),
        cache: "no-store",
      });
    }
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="ml-64 flex-1 p-8">
        <h1 className="text-2xl font-light tracking-wider text-white mb-6">Page Banners</h1>
        <div className="flex gap-2 mb-6 flex-wrap">
          {PAGES.map((p) => (
            <button key={p.key} onClick={() => setPageKey(p.key)}
              className={`px-4 py-2 text-sm rounded-full border transition-colors ${
                pageKey === p.key ? "bg-forest/20 text-forest border-forest/30" : "bg-transparent text-silver/50 border-silver/20 hover:text-white"
              }`}>{p.label}</button>
          ))}
        </div>
        <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6 mb-6">
          <div onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-silver/20 rounded-xl py-6 text-center cursor-pointer hover:border-forest/50 transition-colors">
            {uploading ? <p className="text-silver/60 text-sm">Uploading...</p> : (
              <><p className="text-silver/60 text-sm">Click to upload images</p>
              <p className="text-xs text-silver/40 mt-1">PNG, JPG, WebP supported</p></>
            )}
            <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
          </div>
        </div>
        {banners.length === 0 ? (
          <div className="bg-deep-blue/20 border border-silver/10 rounded-xl p-12 text-center">
            <p className="text-silver/40 text-sm">No banners yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {banners.map((b, i) => (
              <div key={b.id} draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDragEnd={handleDragEnd}
                className={`flex gap-4 bg-deep-blue/30 border rounded-xl p-4 transition-all cursor-grab ${
                  dragIdx === i ? "border-forest/50" : "border-silver/10"}`}>
                <div className="w-48 h-28 rounded-lg overflow-hidden bg-deep-dark flex-shrink-0">
                  {b.image_url ? <img src={b.image_url} alt={b.alt_text} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-silver/20" />}
                </div>
                <div className="flex-1 space-y-2">
                  <input value={b.alt_text || ""} onChange={(e) => {
                    const s = [...banners]; s[i].alt_text = e.target.value; setBanners(s);
                  }} placeholder="Alt text" className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white" />
                  {b.orientation === "portrait" ? <span className="text-[10px] px-2 py-0.5 rounded bg-ice/20 text-ice mr-2">竖版</span> : <span className="text-[10px] px-2 py-0.5 rounded bg-forest/20 text-forest mr-2">横版</span>}
                  <button onClick={() => deleteBanner(b.id)}
                    className="text-red-400/60 hover:text-red-400 text-xs">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
