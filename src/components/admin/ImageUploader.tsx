"use client";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image/compress";

interface ImageUploaderProps {
  bucket?: string;
  onUploaded: (urls: string[]) => void;
  existing?: string[];
}

export default function ImageUploader({ bucket = "products", onUploaded, existing = [] }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>(existing);
  const [error, setError] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal state when existing prop changes (e.g. after async load)
  useEffect(() => { setImages(existing); }, [existing]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    const supabase = createClient();
    if (!supabase) { setError("Supabase not configured"); setUploading(false); return; }

    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const compressed = await compressImage(file, 1920, 0.85);

        // Upload via server API (bypasses RLS with service_role key)
        const formData = new FormData();
        const ext = "webp";
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        formData.append("file", compressed, `${path}.${ext}`);
        formData.append("path", path);
        formData.append("bucket", bucket);

        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadResult = await uploadRes.json();

        if (uploadResult.error) {
          setError(uploadResult.error.includes("bucket")
            ? `Storage bucket "${bucket}" not found. Create it in Supabase Dashboard → Storage, then run the setup SQL.`
            : uploadResult.error);
          continue;
        }
        if (uploadResult.url) {
          uploaded.push(uploadResult.url);
        }
      } catch (e: any) {
        setError(e?.message || "Upload failed");
      }
    }
    if (uploaded.length > 0) {
      const all = [...images, ...uploaded];
      setImages(all);
      onUploaded(all);
    }
    setUploading(false);
  }

  function removeImage(index: number) {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    onUploaded(updated);
  }

  // ── Drag & Drop reorder ──
  function handleDragStart(index: number) { setDragIdx(index); }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === index) return;
    const reordered = [...images];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(index, 0, moved);
    setImages(reordered);
    setDragIdx(index); // update drag index to new position
  }

  function handleDragEnd() {
    setDragIdx(null);
    // Commit the final order
    onUploaded(images);
  }

  const firstImage = images[0];
  const restImages = images.slice(1);

  return (
    <div className="space-y-3">
      {/* Upload zone */}
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-silver/20 rounded-xl p-8 text-center cursor-pointer hover:border-forest/50 transition-colors"
      >
        {uploading ? (
          <p className="text-silver/60">⏳ Compressing & uploading...</p>
        ) : (
          <>
            <p className="text-silver/60 text-sm">📁 Click to upload images</p>
            <p className="text-xs text-silver/40 mt-1">Auto-compressed to WebP · PNG, JPG supported</p>
          </>
        )}
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* Images display */}
      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-silver/40 flex items-center gap-2">
            <span>🖼 {images.length} image{images.length > 1 ? "s" : ""}</span>
            <span className="text-silver/20">·</span>
            <span className="text-silver/30">Drag to reorder</span>
          </p>

          {/* First image (main) */}
          <div className="flex gap-3">
            <div
              draggable
              onDragStart={() => handleDragStart(0)}
              onDragOver={(e) => handleDragOver(e, 0)}
              onDragEnd={handleDragEnd}
              className={`relative w-1/2 aspect-square rounded-xl overflow-hidden bg-deep-dark border-2 group cursor-grab active:cursor-grabbing transition-all ${
                dragIdx === 0 ? "opacity-60 scale-95 ring-2 ring-forest" : "border-silver/10 hover:border-forest/40"
              }`}
            >
              <img src={firstImage} alt="Main" className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-forest/80 text-deep-dark text-[10px] font-medium rounded">Main</div>
              <button type="button" onClick={() => removeImage(0)}
                className="absolute top-2 right-2 w-6 h-6 bg-red-500/80 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">×</button>
              <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end pb-1">
                <span className="text-[10px] text-white/70 px-2">↕ drag</span>
              </div>
            </div>

            {/* Thumbnails grid */}
            <div className="grid grid-cols-2 gap-2 flex-1 content-start">
              {restImages.map((url, i) => {
                const actualIndex = i + 1;
                return (
                  <div
                    key={actualIndex}
                    draggable
                    onDragStart={() => handleDragStart(actualIndex)}
                    onDragOver={(e) => handleDragOver(e, actualIndex)}
                    onDragEnd={handleDragEnd}
                    className={`relative aspect-square rounded-lg overflow-hidden bg-deep-dark border group cursor-grab active:cursor-grabbing transition-all ${
                      dragIdx === actualIndex ? "opacity-60 scale-90 ring-2 ring-forest" : "border-silver/10 hover:border-forest/40"
                    }`}
                  >
                    <img src={url} alt={`Image ${actualIndex}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(actualIndex)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500/80 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">×</button>
                    <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end pb-0.5">
                      <span className="text-[9px] text-white/50 px-1.5">↕</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
