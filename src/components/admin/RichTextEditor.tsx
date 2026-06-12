"use client";
import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { compressImage } from "@/lib/image/compress";

const QuillEditor = dynamic(() => import("@/components/admin/QuillEditor"), { ssr: false });

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
  style?: Record<string, string>;
}

export default function RichTextEditor({ content, onSave }: { content: any; onSave: (c: any) => Promise<void> }) {
  const [blocks, setBlocks] = useState<Block[]>(content?.blocks || []);
  const [saving, setSaving] = useState(false);
  const [previews, setPreviews] = useState<Set<number>>(new Set());
  const imgInputRef = useRef<HTMLInputElement>(null);

  function addBlock(type: string) {
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
      case "multirow":
        newBlock = { type, data: { columns: 3, items: [{ icon: "", title: "", text: "" }] }, style: {} };
        break;
      default:
        newBlock = { type, data: type === "divider" ? "" : "", style: {} };
    }
    setBlocks([...blocks, newBlock]);
  }

  function updateBlock(i: number, data: any) {
    const updated = [...blocks];
    updated[i] = { ...updated[i], data };
    setBlocks(updated);
  }

  function updateStyle(i: number, key: string, value: string) {
    const updated = [...blocks];
    updated[i] = { ...updated[i], style: { ...(updated[i].style || {}), [key]: value } };
    setBlocks(updated);
  }

  function removeBlock(i: number) {
    setBlocks(blocks.filter((_, idx) => idx !== i));
  }

  function moveBlock(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const updated = [...blocks];
    [updated[i], updated[j]] = [updated[j], updated[i]];
    setBlocks(updated);
  }

  function togglePreview(i: number) {
    const s = new Set(previews);
    if (s.has(i)) s.delete(i); else s.add(i);
    setPreviews(s);
  }

  async function handleImageUpload() {
    const file = imgInputRef.current?.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 1920, 0.85);
      const path = `product-content/${Date.now()}.webp`;
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
          updated[updated.length - 1].data = { url: result.url, alt: "", caption: "", maxWidth: "", maxHeight: "", overlay: { text: "", fontSize: "16", color: "#ffffff" } };
          return updated;
        });
      }
    } catch (e: any) { alert(e.message); }
    if (imgInputRef.current) imgInputRef.current.value = "";
  }

  async function handleSave() {
    setSaving(true);
    await onSave({ blocks });
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      {/* ── Block type toolbar ── */}
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

      {/* ── Block list ── */}
      {blocks.map((block, i) => (
        <div key={i} className="bg-deep-dark/50 border border-silver/10 rounded-xl p-4">
          {/* Block header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-silver/40 uppercase tracking-wider font-mono">{block.type}</span>
            <div className="flex gap-1">
              <button type="button" onClick={() => moveBlock(i, -1)} className="text-silver/30 hover:text-white text-xs px-1">↑</button>
              <button type="button" onClick={() => moveBlock(i, 1)} className="text-silver/30 hover:text-white text-xs px-1">↓</button>
              <button type="button" onClick={() => removeBlock(i)} className="text-red-400/60 hover:text-red-400 text-xs px-1">×</button>
            </div>
          </div>

          {/* ── Content editors by type ── */}
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
                  className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-xs text-white focus:outline-none mb-2" placeholder="Overlay text..." />
                <div className="flex gap-2">
                  <select value={block.data.overlay?.fontSize || "16"} onChange={(e) => updateBlock(i, { ...block.data, overlay: { ...block.data.overlay, fontSize: e.target.value } })}
                    className="bg-deep-dark border border-silver/10 rounded px-2 py-1 text-xs text-silver/60 flex-1">
                    {[12,14,16,18,20,24,28,32,36,42,48].map(s => <option key={s} value={s}>{s}px</option>)}
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
                  <button key={n} type="button" onClick={() => updateBlock(i, { ...block.data, columns: n })}
                    className={`px-2 py-1 text-xs rounded border ${block.data.columns === n ? "bg-forest/20 text-forest border-forest/30" : "text-silver/50 border-silver/20"}`}>{n}</button>
                ))}
              </div>
              {(block.data.items || []).map((item: any, idx: number) => (
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
                  <button type="button" onClick={() => {
                    const items = (block.data.items || []).filter((_: any, fi: number) => fi !== idx);
                    updateBlock(i, { ...block.data, items });
                  }} className="text-red-400/60 text-xs">×</button>
                </div>
              ))}
              <button type="button" onClick={() => {
                const items = [...(block.data.items || []), { icon: "", image_url: "", title: "", text: "" }];
                updateBlock(i, { ...block.data, items });
              }} className="text-xs text-ice/60 hover:text-ice">+ Add Card</button>
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
                    <span className="text-[10px] text-silver/40">Text segments</span>
                    <button type="button" onClick={() => {
                      const segs = [...(block.data.segments || []), { text: "", color: "", fontSize: "", fontWeight: "" }];
                      updateBlock(i, { ...block.data, segments: segs });
                    }} className="text-xs text-ice/60 hover:text-ice">+ Segment</button>
                  </div>
                  {(block.data.segments || []).map((seg: any, si: number) => (
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
                        {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <select value={seg.fontWeight || ""} onChange={(e) => {
                        const segs = [...(block.data.segments || [])];
                        segs[si] = { ...segs[si], fontWeight: e.target.value };
                        updateBlock(i, { ...block.data, segments: segs });
                      }} className="w-14 bg-deep-dark border border-silver/10 rounded px-1 py-1.5 text-[10px] text-silver/60 flex-shrink-0">
                        <option value="">Weight</option>
                        {FONT_WEIGHTS.map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                      <button type="button" onClick={() => {
                        const segs = (block.data.segments || []).filter((_: any, fi: number) => fi !== si);
                        updateBlock(i, { ...block.data, segments: segs });
                      }} className="text-red-400/60 hover:text-red-400 text-xs flex-shrink-0 opacity-0 group-hover:opacity-100">×</button>
                    </div>
                  ))}
                  {(!block.data.segments || block.data.segments.length === 0) && (
                    <p className="text-[10px] text-silver/40 py-2">No segments. Click "+ Segment" to add styled text.</p>
                  )}
                </div>
              </div>
            </div>
          )}
          {block.type === "rich-html" && (
            <div className="rich-html-editor" key={i}>
              <QuillEditor value={block.data.html || ""} onChange={(html) => updateBlock(i, { html })} minHeight={250} />
            </div>
          )}
          {block.type === "divider" && (
            <p className="text-xs text-silver/40 text-center">— Divider —</p>
          )}

          {/* ── Style controls ── */}
          <div className="flex gap-2 mt-3 pt-3 border-t border-silver/10 flex-wrap">
            <select value={block.style?.color || ""} onChange={(e) => updateStyle(i, "color", e.target.value)}
              className="bg-deep-dark border border-silver/10 rounded px-2 py-1 text-xs text-silver/60">
              <option value="">Default color</option>
              {COLORS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select value={block.style?.fontSize || ""} onChange={(e) => updateStyle(i, "fontSize", e.target.value)}
              className="bg-deep-dark border border-silver/10 rounded px-2 py-1 text-xs text-silver/60">
              <option value="">Auto size</option>
              {FONT_SIZES.map(s => <option key={s} value={s}>{s}px</option>)}
            </select>
            <select value={block.style?.fontWeight || ""} onChange={(e) => updateStyle(i, "fontWeight", e.target.value)}
              className="bg-deep-dark border border-silver/10 rounded px-2 py-1 text-xs text-silver/60">
              <option value="">Auto weight</option>
              {FONT_WEIGHTS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
            <select value={block.style?.textAlign || ""} onChange={(e) => updateStyle(i, "textAlign", e.target.value)}
              className="bg-deep-dark border border-silver/10 rounded px-2 py-1 text-xs text-silver/60">
              <option value="">Auto align</option>
              {TEXT_ALIGNS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* ── Preview toggle ── */}
          <div className="mt-3">
            <button type="button" onClick={() => togglePreview(i)}
              className="text-[10px] text-silver/40 hover:text-silver/70 uppercase tracking-wider flex items-center gap-1">
              {previews.has(i) ? "▼" : "▶"} Preview
            </button>
            {previews.has(i) && (
              <div className="mt-2 p-4 bg-deep-dark/40 border border-silver/10 rounded-lg">
                <BlockPreview block={block} />
              </div>
            )}
          </div>
        </div>
      ))}
      {blocks.length === 0 && <p className="text-xs text-silver/40 py-4 text-center">No content blocks yet. Add one above.</p>}

      {/* ── Save button ── */}
      <button type="button" onClick={handleSave} disabled={saving}
        className="px-6 py-2 bg-forest text-deep-dark text-sm font-medium rounded-lg hover:bg-forest/90 transition-colors disabled:opacity-50">
        {saving ? "Saving..." : "💾 Save Content"}
      </button>
    </div>
  );
}

function BlockPreview({ block }: { block: Block }) {
  const s = block.style || {};
  const style: React.CSSProperties = {
    color: s.color || undefined,
    fontSize: s.fontSize ? `${s.fontSize}px` : undefined,
    fontWeight: s.fontWeight || undefined,
    textAlign: s.textAlign as any || undefined,
  };

  switch (block.type) {
    case "heading":
      return <div style={{ color: style.color || "#fff", fontSize: style.fontSize || "20px", fontWeight: style.fontWeight, textAlign: style.textAlign as any }} className="tracking-wide">{block.data || "(empty)"}</div>;
    case "text":
      return <p style={style} className="text-sm leading-relaxed">{block.data || "(empty)"}</p>;
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
          {block.data?.image_url && <img src={block.data.image_url} alt="" className="w-24 h-24 rounded object-cover flex-shrink-0" />}
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
              {item.icon && <div className="text-2xl mb-1">{item.icon}</div>}
              {item.title && <div className="text-xs text-white font-medium mb-1">{item.title}</div>}
              {item.text && <div className="text-[10px] text-silver/50">{item.text}</div>}
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
