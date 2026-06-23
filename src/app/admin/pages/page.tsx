"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Button from "@/components/ui/Button";
import { compressImage } from "@/lib/image/compress";
import { useUnsavedWarning } from "@/components/admin/useUnsavedWarning";
import dynamic from "next/dynamic";

const QuillEditor = dynamic(() => import("@/components/admin/QuillEditor"), { ssr: false });

const PAGES = [
  { key: "home", label: "🏠 Home" },
  { key: "products", label: "📦 Products" },
  { key: "product-detail", label: "📄 Product Detail" },
  { key: "about", label: "ℹ️ About Us" },
  { key: "contact", label: "✉️ Contact Us" },
  { key: "sourcing", label: "🏭 Sourcing" },
];

const FONT_SIZES = ["12", "14", "16", "18", "20", "22", "24", "28", "32", "36", "40", "48"];
const FONT_WEIGHTS = ["100", "200", "300", "400", "500", "600", "700", "800"];
const TEXT_ALIGNS = ["left", "center", "right"];
const COLORS = [
  { label: "White", value: "#ffffff" },
  { label: "Silver", value: "#C0C0C0" },
  { label: "Forest Green", value: "#8BC8A0" },
  { label: "Ice Blue", value: "#7EC8E3" },
  { label: "Gold", value: "#e8c87e" },
  { label: "Amber", value: "#ffc107" },
  { label: "Rose", value: "#f44336" },
];

interface Block {
  type: string;
  data: any;
  style: Record<string, string>;
}

export default function AdminPagesPage() {
  const supabase = createClient();
  const [pageKey, setPageKey] = useState("about");
  const [locale, setLocale] = useState("en");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [sloganSize, setSloganSize] = useState(32);
  const [subtitleSize, setSubtitleSize] = useState(24);
  const [showBanner, setShowBanner] = useState(true);
  const [vignetteEnabled, setVignetteEnabled] = useState(true);
  const [contactInfo, setContactInfo] = useState<any[]>([
    { icon: "🏢", label: "Company", value: "" },
    { icon: "📞", label: "Phone", value: "" },
    { icon: "✉️", label: "Email", value: "" },
    { icon: "🕐", label: "Hours", value: "" },
    { icon: "📍", label: "Address", value: "" },
  ]);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [seoImage, setSeoImage] = useState("");
  const [dirty, setDirty] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [showPreviews, setShowPreviews] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [capabilities, setCapabilities] = useState<{ icon: string; title: string; desc: string }[]>([
    { icon: "🏭", title: "Factory Strength", desc: "" },
    { icon: "🔧", title: "OEM/ODM Customization", desc: "" },
    { icon: "✅", title: "Quality Certifications", desc: "" },
    { icon: "📦", title: "Flexible MOQ", desc: "" },
    { icon: "🌍", title: "Global Export", desc: "" },
    { icon: "🛡️", title: "After-Sales Support", desc: "" },
  ]);

  function togglePreview(i: number) {
    const s = new Set(showPreviews);
    if (s.has(i)) s.delete(i); else s.add(i);
    setShowPreviews(s);
  }

  useUnsavedWarning(dirty);

  const markDirty = useCallback(() => setDirty(true), []);
  const [loading, setLoading] = useState(true);
  const imgInputRef = useRef<HTMLInputElement>(null);

  function loadContent(pk: string, loc: string) {
    setLoading(true);
    fetch(`/api/page-content?page=${pk}&locale=${loc}`)
      .then((r) => r.json())
      .then((data) => {
        setTitle(data.title || "");
        setSubtitle(data.subtitle || "");
        setSloganSize(data.slogan_font_size || 32);
        setSubtitleSize(data.subtitle_font_size || 24);
        setShowBanner(data.show_banner !== false);
        setVignetteEnabled(data.vignette_enabled !== false);
        setSeoTitle(data.seo_title || "");
        setSeoDesc(data.seo_description || "");
        setSeoImage(data.seo_image || "");
        // Merge saved contact_info with defaults — add missing default rows
        const saved = data.contact_info || [];
        const defaults = [
          { icon: "🏢", label: "Company", value: "" },
          { icon: "📞", label: "Phone", value: "" },
          { icon: "✉️", label: "Email", value: "" },
          { icon: "🕐", label: "Hours", value: "" },
          { icon: "📍", label: "Address", value: "" },
        ];
        if (saved.length) {
          // Keep saved order but add any missing default rows at the end
          const savedLabels = new Set(saved.map((c: any) => c.label));
          const merged = [...saved];
          for (const d of defaults) {
            if (!savedLabels.has(d.label)) merged.push(d);
          }
          setContactInfo(merged);
        } else {
          setContactInfo(defaults);
        }
        setBlocks(data.content?.blocks || []);
        // Load capabilities from content (sourcing page)
        if (data.content?.capabilities?.length) {
          setCapabilities(data.content.capabilities);
        } else {
          setCapabilities([
            { icon: "🏭", title: "Factory Strength", desc: "" },
            { icon: "🔧", title: "OEM/ODM Customization", desc: "" },
            { icon: "✅", title: "Quality Certifications", desc: "" },
            { icon: "📦", title: "Flexible MOQ", desc: "" },
            { icon: "🌍", title: "Global Export", desc: "" },
            { icon: "🛡️", title: "After-Sales Support", desc: "" },
          ]);
        }
        setDirty(false);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => { loadContent(pageKey, locale); }, [pageKey, locale]);

  function addBlock(type: string) {
    markDirty();
    let newBlock: Block;
    switch (type) {
      case "image":
        newBlock = { type, data: { url: "", alt: "", caption: "", maxWidth: "", maxHeight: "", overlay: { text: "", fontSize: "16", color: "#ffffff" } }, style: {} };
        break;
      case "rich-text":
        newBlock = { type, data: { image_url: "", image_alt: "", segments: [{ text: "", color: "#ffffff", fontSize: "16", fontWeight: "300" }] }, style: {} };
        break;
      case "rich-html":
        newBlock = { type, data: { html: "" }, style: {} };
        break;
      default:
        newBlock = { type, data: "", style: {} };
    }
    setBlocks([...blocks, newBlock]);
  }

  function updateBlock(i: number, data: any) {
    const updated = [...blocks];
    updated[i] = { ...updated[i], data };
    setBlocks(updated);
    markDirty();
  }

  function updateStyle(i: number, key: string, value: string) {
    const updated = [...blocks];
    updated[i] = { ...updated[i], style: { ...updated[i].style, [key]: value } };
    setBlocks(updated);
    markDirty();
  }

  function removeBlock(i: number) {
    setBlocks(blocks.filter((_, idx) => idx !== i));
    markDirty();
  }

  function moveBlock(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const updated = [...blocks];
    [updated[i], updated[j]] = [updated[j], updated[i]];
    setBlocks(updated);
    markDirty();
  }

  async function handleImageUpload() {
    const file = imgInputRef.current?.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 1920, 0.85);
      const path = `pages/${Date.now()}.webp`;
      const formData = new FormData();
      formData.append("file", compressed, `${path}.webp`);
      formData.append("path", path);
      formData.append("bucket", "products");
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await uploadRes.json();
      if (result.error) { alert(result.error); return; }
      if (result.url) {
        addBlock("image");
        setBlocks((prev) => {
          const updated = [...prev];
          updated[updated.length - 1].data = { url: result.url, alt: "", caption: "" };
          return updated;
        });
      }
    } catch (e: any) { alert(e.message); }
  }

  async function handleSave() {
    setSaving(true);
    const sb = createClient();
    if (!sb) { setSaving(false); return; }

    const { error } = await sb.from("page_contents").upsert({
      page_key: pageKey,
      locale,
      title,
      subtitle,
      show_banner: showBanner,
      vignette_enabled: vignetteEnabled,
      slogan_font_size: sloganSize,
      subtitle_font_size: subtitleSize,
      content: { blocks, ...(pageKey === "sourcing" ? { capabilities } : {}) },
      contact_info: contactInfo,
      seo_title: seoTitle || null,
      seo_description: seoDesc || null,
      seo_image: seoImage || null,
    }, { onConflict: "page_key,locale" });

    if (error) alert("Save error: " + error.message);
    else setDirty(false);
    setSaving(false);
  }

  const previewStyle = (style: Record<string, string>) => ({
    color: style.color || undefined,
    fontSize: style.fontSize ? `${style.fontSize}px` : undefined,
    fontWeight: style.fontWeight || undefined,
    textAlign: style.textAlign as any || undefined,
  });

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="ml-64 flex-1 p-8">
        <h1 className="text-2xl font-light tracking-wider text-white mb-8">📝 Page Editor</h1>

        {/* Toolbar */}
        <div className="flex gap-2 mb-6 flex-wrap items-center">
          {PAGES.map((p) => (
            <button key={p.key} onClick={() => setPageKey(p.key)}
              className={`px-4 py-2 text-sm rounded-full border transition-colors ${
                pageKey === p.key ? "bg-forest/20 text-forest border-forest/30" : "bg-transparent text-silver/50 border-silver/20 hover:text-white"
              }`}>{p.label}</button>
          ))}
          <div className="w-px h-6 bg-silver/20 mx-2" />
          <button onClick={() => setLocale("en")}
            className={`px-3 py-1.5 text-xs rounded border ${locale === "en" ? "bg-ice/20 text-ice border-ice/30" : "text-silver/50 border-silver/20"}`}>🇬🇧 EN</button>
          <button onClick={() => setLocale("zh")}
            className={`px-3 py-1.5 text-xs rounded border ${locale === "zh" ? "bg-ice/20 text-ice border-ice/30" : "text-silver/50 border-silver/20"}`}>🇨🇳 ZH</button>
        </div>

        {loading ? (
          <div className="text-silver/40 text-sm py-12 text-center">Loading...</div>
        ) : (
          <div className="space-y-6">
            {/* Title */}
            <input value={title} onChange={(e) => { setTitle(e.target.value); markDirty(); }}
              className="w-full bg-deep-dark border border-silver/10 rounded-lg px-4 py-3 text-xl text-white font-light tracking-wide"
              placeholder="Page Title" />
            <input value={subtitle} onChange={(e) => { setSubtitle(e.target.value); markDirty(); }}
              className="w-full bg-deep-dark border border-silver/10 rounded-lg px-4 py-3 text-base text-forest font-light tracking-wide"
              placeholder="Subtitle (second line of slogan)" />

            {/* Slogan Preview for Home page */}
            {pageKey === "home" && (
              <div className="p-6 bg-deep-dark/40 border border-forest/10 rounded-xl text-center">
                <p className="text-[10px] text-silver/40 uppercase tracking-wider mb-3">✨ Slogan Preview</p>
                <div className="flex justify-center gap-4 mb-4">
                  <label className="flex items-center gap-2 text-xs text-silver/60">
                    Line 1 (px): <select value={sloganSize} onChange={(e) => setSloganSize(parseInt(e.target.value))}
                      className="bg-deep-dark border border-silver/10 rounded px-2 py-1 text-white text-xs">
                      {[16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,48,54,60].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-silver/60">
                    Line 2 (px): <select value={subtitleSize} onChange={(e) => setSubtitleSize(parseInt(e.target.value))}
                      className="bg-deep-dark border border-silver/10 rounded px-2 py-1 text-white text-xs">
                      {[16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,48,54,60].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                </div>
                <p style={{ fontSize: `${sloganSize}px`, letterSpacing: "0.08em" }} className="font-light text-white">{title || "(line 1)"}</p>
                <p style={{ fontSize: `${subtitleSize}px`, letterSpacing: "0.10em" }} className="font-light text-forest mt-2">{subtitle || "(line 2)"}</p>
              </div>
            )}

            {/* Contact Info (only for Contact page) */}
            {pageKey === "contact" && (
              <div className="p-4 bg-deep-dark/40 border border-silver/10 rounded-lg">
                <p className="text-[10px] text-silver/40 uppercase tracking-wider mb-3">📇 Contact Information</p>
                <div className="space-y-2">
                  {contactInfo.map((item: any, i: number) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input value={item.icon || ""} onChange={(e) => {
                        const s = [...contactInfo]; s[i] = { ...s[i], icon: e.target.value }; setContactInfo(s);
                      }} className="w-10 text-center bg-deep-dark border border-silver/10 rounded px-1 py-1.5 text-sm" placeholder="📍" />
                      <input value={item.label || ""} onChange={(e) => {
                        const s = [...contactInfo]; s[i] = { ...s[i], label: e.target.value }; setContactInfo(s);
                      }} className="w-24 bg-deep-dark border border-silver/10 rounded px-2 py-1.5 text-xs text-white" placeholder="Label" />
                      <input value={item.value || ""} onChange={(e) => {
                        const s = [...contactInfo]; s[i] = { ...s[i], value: e.target.value }; setContactInfo(s);
                      }} className="flex-1 bg-deep-dark border border-silver/10 rounded px-2 py-1.5 text-xs text-white" placeholder="Value" />
                      <button onClick={() => setContactInfo([...contactInfo, { icon: "", label: "", value: "" }])}
                        className="text-xs text-ice/60 hover:text-ice flex-shrink-0">+</button>
                      {contactInfo.length > 1 && (
                        <button onClick={() => setContactInfo(contactInfo.filter((_: any, idx: number) => idx !== i))}
                          className="text-red-400/60 hover:text-red-400 text-xs flex-shrink-0">×</button>
                      )}
                    </div>
                  ))}
                </div>
                {/* Contact Info Preview */}
                <div className="mt-3 p-3 bg-deep-blue/30 border border-silver/10 rounded-lg">
                  <p className="text-[10px] text-silver/40 uppercase tracking-wider mb-2">Preview:</p>
                  <div className="space-y-2">
                    {contactInfo.filter((c: any) => c.value).map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-silver/80">
                        <span className="text-base">{item.icon}</span>
                        <span className="text-silver/50">{item.label}:</span>
                        <span>{item.value}</span>
                      </div>
                    ))}
                    {!contactInfo.some((c: any) => c.value) && (
                      <p className="text-xs text-silver/40">No contact info entered yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Page settings */}
            <div className="flex gap-4 items-center p-4 bg-deep-dark/40 border border-silver/10 rounded-lg flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={showBanner} onChange={(e) => setShowBanner(e.target.checked)}
                  className="w-4 h-4 rounded accent-forest" />
                <span className="text-sm text-silver/80">Show Banner</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={vignetteEnabled} onChange={(e) => setVignetteEnabled(e.target.checked)}
                  className="w-4 h-4 rounded accent-forest" />
                <span className="text-sm text-silver/80">Image vignette fade</span>
              </label>
            </div>

            {/* SEO Settings */}
            <div className="p-4 bg-deep-dark/40 border border-silver/10 rounded-lg">
              <p className="text-[10px] text-silver/40 uppercase tracking-wider mb-3">🔍 SEO</p>
              <input value={seoTitle} onChange={(e) => { setSeoTitle(e.target.value); markDirty(); }}
                placeholder="Meta Title (leave empty for auto)" className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white mb-2" />
              <textarea value={seoDesc} onChange={(e) => { setSeoDesc(e.target.value); markDirty(); }} rows={2}
                placeholder="Meta Description" className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white mb-2" />
              <div className="flex gap-2 items-center">
              <input value={seoImage} onChange={(e) => { setSeoImage(e.target.value); markDirty(); }}
                placeholder="OG Image URL (leave empty for auto)" className="flex-1 bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white font-mono text-xs" />
              <span
                onClick={async () => {
                  const input = document.createElement("input");
                  input.type = "file"; input.accept = "image/*";
                  input.onchange = async () => {
                    const file = input.files?.[0]; if (!file) return;
                    const { compressImage } = await import("@/lib/image/compress");
                    const compressed = await compressImage(file, 1200, 0.85);
                    const fd = new FormData();
                    fd.append("file", compressed, "og/" + Date.now() + ".webp");
                    fd.append("path", "og/" + Date.now() + ".webp");
                    fd.append("bucket", "products");
                    const res = await fetch("/api/upload", { method: "POST", body: fd });
                    const result = await res.json();
                    if (result.url) { setSeoImage(result.url); markDirty(); }
                  };
                  input.click();
                }}
                className="px-3 py-2 text-xs bg-ice/20 text-ice border border-ice/30 rounded hover:bg-ice/30 transition-colors cursor-pointer whitespace-nowrap"
              >📁 Upload</span>
            </div>
            </div>

            {/* Capabilities Editor (only for Sourcing page) */}
            {pageKey === "sourcing" && (
              <div className="p-4 bg-deep-dark/40 border border-silver/10 rounded-lg">
                <p className="text-[10px] text-silver/40 uppercase tracking-wider mb-3">🏭 Capability Cards</p>
                <p className="text-[10px] text-silver/40 mb-4">Edit the 6 capability cards displayed on the Sourcing page.</p>
                <div className="space-y-4">
                  {capabilities.map((cap, i) => (
                    <div key={i} className="bg-deep-blue/20 border border-silver/10 rounded-lg p-4">
                      <div className="flex gap-3 items-start mb-2">
                        <input value={cap.icon} onChange={(e) => {
                          const s = [...capabilities]; s[i] = { ...s[i], icon: e.target.value }; setCapabilities(s); markDirty();
                        }} className="w-10 text-center bg-deep-dark border border-silver/10 rounded px-1 py-1.5 text-sm" />
                        <input value={cap.title} onChange={(e) => {
                          const s = [...capabilities]; s[i] = { ...s[i], title: e.target.value }; setCapabilities(s); markDirty();
                        }} className="flex-1 bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white font-medium" />
                      </div>
                      <textarea value={cap.desc} onChange={(e) => {
                        const s = [...capabilities]; s[i] = { ...s[i], desc: e.target.value }; setCapabilities(s); markDirty();
                      }} rows={3} className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-xs text-white resize-y"
                        placeholder="Describe this capability..." />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top save bar */}
            <div className="sticky top-0 z-20 -mx-8 px-8 py-3 bg-deep-blue/90 backdrop-blur-md border-b border-silver/10 flex items-center justify-between">
              <span className="text-xs text-silver/40">{dirty ? "⚠️ Unsaved changes" : "✅ All saved"}</span>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "💾 Save Page"}
              </Button>
            </div>

            {/* Block tools */}
            <div className="flex gap-2 flex-wrap">
              <button type="button" onClick={() => addBlock("heading")} className="px-3 py-1.5 text-xs bg-deep-blue border border-silver/20 rounded text-silver hover:text-white">+ Heading</button>
              <button type="button" onClick={() => addBlock("text")} className="px-3 py-1.5 text-xs bg-deep-blue border border-silver/20 rounded text-silver hover:text-white">+ Text</button>
              <button type="button" onClick={() => addBlock("image")} className="px-3 py-1.5 text-xs bg-deep-blue border border-silver/20 rounded text-silver hover:text-white">+ Image</button>
              <button type="button" onClick={() => addBlock("multirow")} className="px-3 py-1.5 text-xs bg-deep-blue border border-silver/20 rounded text-silver hover:text-white">+ Card Grid</button>
              <button type="button" onClick={() => addBlock("rich-text")} className="px-3 py-1.5 text-xs bg-deep-blue border border-silver/20 rounded text-silver hover:text-white">+ Rich Text</button>
              <button type="button" onClick={() => addBlock("rich-html")} className="px-3 py-1.5 text-xs bg-forest/20 text-forest border border-forest/30 rounded hover:bg-forest/30 transition-colors">🎨 HTML Rich</button>
              <button type="button" onClick={() => addBlock("divider")} className="px-3 py-1.5 text-xs bg-deep-blue border border-silver/20 rounded text-silver hover:text-white">+ Divider</button>
              <label className="px-3 py-1.5 text-xs bg-deep-blue border border-silver/20 rounded text-silver hover:text-white cursor-pointer">
                📤 Upload Image
                <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>

            {/* Blocks */}
            <div className="space-y-3">
              {blocks.map((block, i) => (
                <div key={i} className="bg-deep-blue/30 border border-silver/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] text-silver/40 uppercase tracking-wider font-mono">{block.type}</span>
                    <div className="flex gap-1">
                      <button onClick={() => moveBlock(i, -1)} className="text-silver/30 hover:text-white text-xs px-1">↑</button>
                      <button onClick={() => moveBlock(i, 1)} className="text-silver/30 hover:text-white text-xs px-1">↓</button>
                      <button onClick={() => removeBlock(i)} className="text-red-400/60 hover:text-red-400 text-xs px-1">×</button>
                    </div>
                  </div>

                  {/* Content editor */}
                  {block.type === "text" && (
                    <textarea value={block.data} onChange={(e) => updateBlock(i, e.target.value)}
                      className="w-full bg-deep-dark border border-silver/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none min-h-[80px]"
                      placeholder="Enter text content..." />
                  )}
                  {block.type === "heading" && (
                    <input value={block.data} onChange={(e) => updateBlock(i, e.target.value)}
                      className="w-full bg-deep-dark border border-silver/10 rounded-lg px-3 py-2 text-lg text-white font-light tracking-wide focus:outline-none"
                      placeholder="Heading text..." />
                  )}
                  {block.type === "image" && (
                    <div className="space-y-3">
                      {block.data.url && (
                        <div className="relative rounded-lg overflow-hidden bg-deep-dark" style={{ maxWidth: block.data.maxWidth || "100%", maxHeight: block.data.maxHeight || "320px" }}>
                          <img src={block.data.url} alt="" className="w-full h-full object-contain" style={{ maxHeight: block.data.maxHeight || "320px" }} />
                          {/* Overlay preview */}
                          {block.data.overlay?.text && (
                            <div className="absolute bottom-0 left-0 right-0 p-4" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.7))" }}>
                              <span style={{ fontSize: `${block.data.overlay.fontSize || 16}px`, color: block.data.overlay.color || "#ffffff" }}>
                              {block.data.overlay.text}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      <input value={block.data.url} onChange={(e) => updateBlock(i, { ...block.data, url: e.target.value })}
                        className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white font-mono text-xs focus:outline-none" placeholder="Image URL..." />
                      <div className="grid grid-cols-2 gap-2">
                        <input value={block.data.maxWidth || ""} onChange={(e) => updateBlock(i, { ...block.data, maxWidth: e.target.value })}
                          className="bg-deep-dark border border-silver/10 rounded px-3 py-2 text-xs text-white focus:outline-none" placeholder="Max width (e.g. 800px, 70%)" />
                        <input value={block.data.maxHeight || ""} onChange={(e) => updateBlock(i, { ...block.data, maxHeight: e.target.value })}
                          className="bg-deep-dark border border-silver/10 rounded px-3 py-2 text-xs text-white focus:outline-none" placeholder="Max height (e.g. 500px)" />
                      </div>
                      <input value={block.data.alt || ""} onChange={(e) => updateBlock(i, { ...block.data, alt: e.target.value })}
                        className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-xs text-white focus:outline-none" placeholder="Alt text..." />
                      <input value={block.data.caption || ""} onChange={(e) => updateBlock(i, { ...block.data, caption: e.target.value })}
                        className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-xs text-white focus:outline-none" placeholder="Caption (optional)..." />

                      {/* Overlay text */}
                      <div className="pt-2 border-t border-silver/10">
                        <p className="text-[10px] text-silver/40 uppercase tracking-wider mb-2">Text Overlay</p>
                        <input value={block.data.overlay?.text || ""} onChange={(e) => updateBlock(i, { ...block.data, overlay: { ...block.data.overlay, text: e.target.value } })}
                          className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-xs text-white focus:outline-none mb-2" placeholder="Overlay text (floats over image bottom)..." />
                        <div className="flex gap-2">
                          <select value={block.data.overlay?.fontSize || "16"} onChange={(e) => updateBlock(i, { ...block.data, overlay: { ...block.data.overlay, fontSize: e.target.value } })}
                            className="bg-deep-dark border border-silver/10 rounded px-2 py-1 text-xs text-silver/60 flex-1">
                            <option value="12">12px</option>
                            <option value="14">14px</option>
                            <option value="16">16px</option>
                            <option value="18">18px</option>
                            <option value="20">20px</option>
                            <option value="24">24px</option>
                            <option value="28">28px</option>
                            <option value="32">32px</option>
                            <option value="36">36px</option>
                            <option value="42">42px</option>
                            <option value="48">48px</option>
                          </select>
                          <input type="color" value={block.data.overlay?.color || "#ffffff"} onChange={(e) => updateBlock(i, { ...block.data, overlay: { ...block.data.overlay, color: e.target.value } })}
                            className="w-10 h-8 rounded cursor-pointer bg-transparent border-0 p-0 flex-shrink-0" title="Overlay color" />
                        </div>
                      </div>
                    </div>
                  )}
                  {block.type === "multirow" && (
                    <div className="space-y-2">
                      <div className="flex gap-2 items-center">
                        <span className="text-xs text-silver/50">Columns:</span>
                        {[1, 2, 3, 4].map((n) => (
                          <button key={n} onClick={() => updateBlock(i, { ...block.data, columns: n })}
                            className={`px-2 py-1 text-xs rounded border ${block.data.columns === n ? "bg-forest/20 text-forest border-forest/30" : "text-silver/50 border-silver/20"}`}>{n}</button>
                        ))}
                      </div>
                      {((block.data.items) || []).map((item: any, idx: number) => (
                        <div key={idx} className="flex gap-2 items-start bg-deep-dark/50 rounded-lg p-2">
                          <div className="flex flex-col gap-1 w-16">
                            <input value={item.icon || ""} onChange={(e) => {
                              const items = [...(block.data.items || [])];
                              items[idx] = { ...items[idx], icon: e.target.value };
                              updateBlock(i, { ...block.data, items });
                            }} className="w-full bg-transparent text-center text-sm" placeholder="🔤" />
                            <input value={item.image_url || ""} onChange={(e) => {
                              const items = [...(block.data.items || [])];
                              items[idx] = { ...items[idx], image_url: e.target.value };
                              updateBlock(i, { ...block.data, items });
                            }} className="w-full bg-transparent text-center text-[8px] text-silver/40 font-mono" placeholder="img URL" />
                          </div>
                          <input value={item.title || ""} onChange={(e) => {
                            const items = [...(block.data.items || [])];
                            items[idx] = { ...items[idx], title: e.target.value };
                            updateBlock(i, { ...block.data, items });
                          }} className="flex-1 bg-deep-dark border border-silver/10 rounded px-2 py-1 text-xs text-white" placeholder="Title" />
                          <textarea value={item.text || ""} onChange={(e) => {
                            const items = [...(block.data.items || [])];
                            items[idx] = { ...items[idx], text: e.target.value };
                            updateBlock(i, { ...block.data, items });
                          }} className="flex-[2] bg-deep-dark border border-silver/10 rounded px-2 py-1 text-xs text-white" placeholder="Content..." rows={2} />
                          <button onClick={() => {
                            const items = (block.data.items || []).filter((_: any, fi: number) => fi !== idx);
                            updateBlock(i, { ...block.data, items });
                          }} className="text-red-400/60 text-xs">×</button>
                        </div>
                      ))}
                      <button onClick={() => {
                        const items = [...(block.data.items || []), { icon: "", title: "", text: "" }];
                        updateBlock(i, { ...block.data, items });
                      }} className="text-xs text-ice/60 hover:text-ice">+ Add Card</button>
                    </div>
                  )}
                  {block.type === "rich-html" && (
                    <div className="rich-html-editor" key={i}>
                      <QuillEditor value={block.data.html || ""} onChange={(html) => updateBlock(i, { html })} minHeight={250} />
                    </div>
                  )}
                  {block.type === "rich-text" && (
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="w-1/3">
                          <input value={block.data.image_url || ""} onChange={(e) => updateBlock(i, { ...block.data, image_url: e.target.value })}
                            className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-xs text-white font-mono focus:outline-none" placeholder="Image URL (optional)" />
                          <input value={block.data.image_alt || ""} onChange={(e) => updateBlock(i, { ...block.data, image_alt: e.target.value })}
                            className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-xs text-white mt-2 focus:outline-none" placeholder="Alt text" />
                          {block.data.image_url && (
                            <img src={block.data.image_url} alt="" className="w-full h-24 object-cover rounded mt-2" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-silver/40">Text segments (each word/phrase can have different color/size/weight)</span>
                            <button onClick={() => {
                              const segs = [...((block.data.segments) || []), { text: "", color: "", fontSize: "", fontWeight: "" }];
                              updateBlock(i, { ...block.data, segments: segs });
                            }} className="text-xs text-ice/60 hover:text-ice">+ Segment</button>
                          </div>
                          {((block.data.segments) || []).map((seg: any, si: number) => (
                            <div key={si} className="flex gap-1 items-start group">
                              <input value={seg.text} onChange={(e) => {
                                const segs = [...(block.data.segments || [])];
                                segs[si] = { ...segs[si], text: e.target.value };
                                updateBlock(i, { ...block.data, segments: segs });
                              }} className="flex-1 bg-deep-dark border border-silver/10 rounded px-2 py-1.5 text-xs text-white" placeholder="Text..." style={{ color: seg.color || undefined, fontWeight: seg.fontWeight || undefined, fontSize: seg.fontSize ? `${seg.fontSize}px` : undefined }} />
                              <input type="color" value={seg.color || "#ffffff"} onChange={(e) => {
                                const segs = [...(block.data.segments || [])];
                                segs[si] = { ...segs[si], color: e.target.value };
                                updateBlock(i, { ...block.data, segments: segs });
                              }} className="w-7 h-7 rounded cursor-pointer bg-transparent border-0 p-0 flex-shrink-0" title="Color" />
                              <select value={seg.fontSize || ""} onChange={(e) => {
                                const segs = [...(block.data.segments || [])];
                                segs[si] = { ...segs[si], fontSize: e.target.value };
                                updateBlock(i, { ...block.data, segments: segs });
                              }} className="w-14 bg-deep-dark border border-silver/10 rounded px-1 py-1.5 text-[10px] text-silver/60 flex-shrink-0">
                                <option value="">Size</option>
                                {FONT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <select value={seg.fontWeight || ""} onChange={(e) => {
                                const segs = [...(block.data.segments || [])];
                                segs[si] = { ...segs[si], fontWeight: e.target.value };
                                updateBlock(i, { ...block.data, segments: segs });
                              }} className="w-14 bg-deep-dark border border-silver/10 rounded px-1 py-1.5 text-[10px] text-silver/60 flex-shrink-0">
                                <option value="">Weight</option>
                                {FONT_WEIGHTS.map((w) => <option key={w} value={w}>{w}</option>)}
                              </select>
                              <button onClick={() => {
                                const segs = (block.data.segments || []).filter((_: any, fi: number) => fi !== si);
                                updateBlock(i, { ...block.data, segments: segs });
                              }} className="text-red-400/60 hover:text-red-400 text-xs flex-shrink-0 opacity-0 group-hover:opacity-100">×</button>
                            </div>
                          ))}
                          {(!block.data.segments || block.data.segments.length === 0) && (
                            <p className="text-[10px] text-silver/40 py-2">No segments. Click "+ Segment" to add text with individual styling.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {block.type === "divider" && (
                    <p className="text-xs text-silver/40 text-center">— Divider —</p>
                  )}

                  {/* Style controls */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-silver/10 flex-wrap">
                    <select value={block.style.color || ""} onChange={(e) => updateStyle(i, "color", e.target.value)}
                      className="bg-deep-dark border border-silver/10 rounded px-2 py-1 text-xs text-silver/60">
                      <option value="">Default color</option>
                      {COLORS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <select value={block.style.fontSize || ""} onChange={(e) => updateStyle(i, "fontSize", e.target.value)}
                      className="bg-deep-dark border border-silver/10 rounded px-2 py-1 text-xs text-silver/60">
                      <option value="">Auto size</option>
                      {FONT_SIZES.map((s) => <option key={s} value={s}>{s}px</option>)}
                    </select>
                    <select value={block.style.fontWeight || ""} onChange={(e) => updateStyle(i, "fontWeight", e.target.value)}
                      className="bg-deep-dark border border-silver/10 rounded px-2 py-1 text-xs text-silver/60">
                      <option value="">Auto weight</option>
                      {FONT_WEIGHTS.map((w) => <option key={w} value={w}>{w}</option>)}
                    </select>
                    <select value={block.style.textAlign || ""} onChange={(e) => updateStyle(i, "textAlign", e.target.value)}
                      className="bg-deep-dark border border-silver/10 rounded px-2 py-1 text-xs text-silver/60">
                      <option value="">Auto align</option>
                      {TEXT_ALIGNS.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>

                  {/* Preview — toggleable */}
                  <div className="mt-3">
                    <button type="button" onClick={() => togglePreview(i)}
                      className="text-[10px] text-silver/40 hover:text-silver/70 uppercase tracking-wider flex items-center gap-1 transition-colors">
                      {showPreviews.has(i) ? "▼" : "▶"} Preview
                    </button>
                    {showPreviews.has(i) && (
                      <div className="mt-2 p-4 bg-deep-dark/40 border border-silver/10 rounded-lg">
                        <BlockPreview block={block} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {blocks.length === 0 && <p className="text-xs text-silver/40 py-8 text-center">No content yet. Add blocks above.</p>}
            </div>

            {/* Save */}
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "💾 Save Page"}</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function BlockPreview({ block }: { block: Block }) {
  const s = block.style || {};
  const style: React.CSSProperties = {
    color: s.color || undefined,
    fontSize: s.fontSize ? `${s.fontSize}px` : undefined,
    fontWeight: s.fontWeight || undefined,
    textAlign: (s.textAlign as any) || undefined,
  };

  switch (block.type) {
    case "heading":
      return <div style={{ color: style.color || "#fff", fontSize: style.fontSize || "20px", fontWeight: style.fontWeight, textAlign: style.textAlign as any }} className="tracking-wide">{block.data || "(empty heading)"}</div>;
    case "text":
      return <p style={style} className="text-sm leading-relaxed">{block.data || "(empty text)"}</p>;
    case "image": {
      if (!block.data?.url) return <p className="text-xs text-silver/40">No image URL</p>;
      return (
        <div className="relative overflow-hidden rounded" style={{ maxWidth: block.data.maxWidth || "300px", maxHeight: block.data.maxHeight || "160px" }}>
          <img src={block.data.url} alt="" className="w-full object-contain" style={{ maxHeight: block.data.maxHeight || "160px" }} />
          {block.data.overlay?.text && (
            <div className="absolute bottom-0 left-0 right-0 p-2" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.7))" }}>
              <span style={{ fontSize: `${block.data.overlay.fontSize || 16}px`, color: block.data.overlay.color || "#fff" }}>{block.data.overlay.text}</span>
            </div>
          )}
        </div>
      );
    }
    case "rich-html":
      return <div className="text-sm leading-relaxed prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: block.data?.html || "" }} />;
    case "rich-text": {
      const segs = block.data?.segments || [];
      return (
        <div className="flex gap-4 items-start">
          {block.data?.image_url && (
            <img src={block.data.image_url} alt="" className="w-24 h-24 rounded object-cover flex-shrink-0" />
          )}
          <div className="text-sm leading-relaxed">
            {segs.map((s: any, si: number) => (
              <span key={si} style={{ color: s.color || undefined, fontSize: s.fontSize ? `${s.fontSize}px` : undefined, fontWeight: s.fontWeight || undefined }}>{s.text}</span>
            ))}
          </div>
        </div>
      );
    }
    case "multirow":
      return (
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${block.data?.columns || 3}, 1fr)` }}>
          {(block.data?.items || []).map((item: any, i: number) => (
            <div key={i} className="p-3 bg-deep-blue/30 border border-silver/10 rounded-lg text-center">
              {item.image_url && <img src={item.image_url} alt="" className="w-full h-20 object-cover rounded mb-2" />}
              <div className="text-2xl mb-1">{item.icon || "📄"}</div>
              <div className="text-xs text-white font-medium mb-1">{item.title}</div>
              <div className="text-[10px] text-silver/50">{item.text}</div>
            </div>
          ))}
        </div>
      );
    case "divider":
      return <hr className="border-silver/10" />;
    default:
      return null;
  }
}
