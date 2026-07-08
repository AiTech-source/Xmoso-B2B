"use client";
import { useState, useRef, useEffect } from "react";

interface SpecSheetButtonProps {
  slug: string;
  locale: string;
  modelNumber: string;
}

export default function SpecSheetButton({ slug, locale, modelNumber }: SpecSheetButtonProps) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function download(format: string) {
    setDownloading(true);
    try {
      const res = await fetch(`/api/product-export?slug=${encodeURIComponent(slug)}&locale=${locale}&format=${format}`);
      if (!res.ok) { alert("Download failed"); setDownloading(false); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${modelNumber}-spec-sheet.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e.message);
    }
    setDownloading(false);
    setOpen(false);
  }

  function printSpecs() {
    const u = "/api/product-print?slug=" + encodeURIComponent(slug) + "&locale=" + locale;
    window.open(u, "_blank", "width=960,height=720");
    setOpen(false);
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={downloading}
        className="flex items-center gap-2 px-4 py-2 border border-silver/20 text-silver/70 hover:text-white hover:border-silver/40 rounded-lg text-xs transition-all"
      >
        {downloading ? "⏳ Downloading..." : "📥 Spec Sheet"}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 bg-deep-blue border border-silver/10 rounded-xl shadow-2xl z-50 py-1 min-w-[180px]">
          <button onClick={() => download("xlsx")}
            className="w-full text-left px-4 py-2.5 text-sm text-silver/70 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2">
            📊 Excel (.xlsx)
          </button>
          <button onClick={() => download("csv")}
            className="w-full text-left px-4 py-2.5 text-sm text-silver/70 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2">
            📄 CSV
          </button>
          <div className="border-t border-silver/10 my-1" />
          <button onClick={printSpecs}
            className="w-full text-left px-4 py-2.5 text-sm text-silver/70 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2">
            🖨️ Print / PDF
          </button>
        </div>
      )}
    </div>
  );
}
