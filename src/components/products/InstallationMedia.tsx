"use client";
import { useState } from "react";

interface MediaItem {
  type: "image" | "pdf" | "video";
  url: string;
  label: string;
}

export default function InstallationMedia({ media }: { media: MediaItem[] }) {
  const [active, setActive] = useState(0);
  if (!media || media.length === 0) return null;

  const current = media[active];

  return (
    <div className="mb-16">
      <h3 className="text-xl text-white tracking-wide mb-6">📐 Installation</h3>
      {/* Tabs */}
      <div className="flex gap-1 mb-4 flex-wrap">
        {media.map((item, i) => (
          <button key={i} onClick={() => setActive(i)}
            className={`px-4 py-2 text-xs rounded-full border transition-colors ${
              i === active ? "bg-forest/20 text-forest border-forest/30" : "text-silver/50 border-silver/20 hover:text-white"
            }`}>
            {item.label}
          </button>
        ))}
      </div>
      {/* Content */}
      <div className="bg-deep-blue/20 border border-silver/10 rounded-xl overflow-hidden">
        {current.type === "image" && (
          <img src={current.url} alt={current.label} className="w-full object-contain max-h-[300px]" />
        )}
        {current.type === "pdf" && (
          <div className="p-12 text-center">
            <p className="text-silver/60 mb-4">📄 {current.label}</p>
            <a href={current.url} target="_blank" rel="noopener noreferrer"
              className="px-6 py-3 bg-forest/20 text-forest rounded-lg text-sm hover:bg-forest/30 transition-colors">
              Download PDF
            </a>
          </div>
        )}
        {current.type === "video" && (
          <div className="aspect-video">
            <iframe src={current.url} className="w-full h-full" allowFullScreen />
          </div>
        )}
      </div>
    </div>
  );
}
