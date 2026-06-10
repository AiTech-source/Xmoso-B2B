"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RichTextEditor({ content, onSave }: { content: any; onSave: (c: any) => Promise<void> }) {
  const [blocks, setBlocks] = useState<any[]>(content?.blocks || []);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  function addBlock(type: string) {
    const newBlock = type === "image"
      ? { type, data: { url: "", alt: "", caption: "" } }
      : { type, data: "" };
    setBlocks([...blocks, newBlock]);
  }

  function updateBlock(i: number, data: any) {
    const updated = [...blocks];
    updated[i] = { ...updated[i], data };
    setBlocks(updated);
  }

  function removeBlock(i: number) {
    setBlocks(blocks.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    setSaving(true);
    await onSave({ blocks });
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button type="button" onClick={() => addBlock("text")} className="px-3 py-1 text-xs bg-deep-blue border border-silver/20 rounded text-silver hover:text-white">+ Text</button>
        <button type="button" onClick={() => addBlock("heading")} className="px-3 py-1 text-xs bg-deep-blue border border-silver/20 rounded text-silver hover:text-white">+ Heading</button>
        <button type="button" onClick={() => addBlock("image")} className="px-3 py-1 text-xs bg-deep-blue border border-silver/20 rounded text-silver hover:text-white">+ Image</button>
        <button type="button" onClick={() => addBlock("divider")} className="px-3 py-1 text-xs bg-deep-blue border border-silver/20 rounded text-silver hover:text-white">+ Divider</button>
      </div>

      {blocks.map((block, i) => (
        <div key={i} className="relative bg-deep-dark/50 border border-silver/10 rounded-lg p-4">
          <button onClick={() => removeBlock(i)} className="absolute top-2 right-2 text-xs text-red-400 hover:text-red-300">×</button>
          {block.type === "text" && (
            <textarea value={block.data} onChange={(e) => updateBlock(i, e.target.value)}
              className="w-full bg-transparent text-sm text-silver/70 placeholder-silver/30 focus:outline-none min-h-[80px]" placeholder="Enter text content..." />
          )}
          {block.type === "heading" && (
            <input value={block.data} onChange={(e) => updateBlock(i, e.target.value)}
              className="w-full bg-transparent text-lg text-white font-medium tracking-wide focus:outline-none" placeholder="Heading text..." />
          )}
          {block.type === "image" && (
            <div className="space-y-2">
              <input value={block.data.url} onChange={(e) => updateBlock(i, { ...block.data, url: e.target.value })}
                className="w-full bg-transparent text-sm text-silver/70 border-b border-silver/10 focus:outline-none pb-1" placeholder="Image URL..." />
              <input value={block.data.alt} onChange={(e) => updateBlock(i, { ...block.data, alt: e.target.value })}
                className="w-full bg-transparent text-xs text-silver/50 focus:outline-none" placeholder="Alt text..." />
            </div>
          )}
          {block.type === "divider" && <p className="text-xs text-silver/40 text-center">— Divider —</p>}
        </div>
      ))}

      <button type="button" onClick={handleSave} disabled={saving}
        className="px-6 py-2 bg-forest text-deep-dark text-sm font-medium rounded-lg hover:bg-forest/90 transition-colors disabled:opacity-50">
        {saving ? "Saving..." : "💾 Save Content"}
      </button>
    </div>
  );
}
