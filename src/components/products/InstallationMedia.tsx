"use client";
import { useState } from "react";
import { cdnUrl } from "@/lib/cdn";

interface MediaItem {
  type: "image" | "pdf" | "video";
  url: string;
  label: string;
}

/** Convert YouTube URLs to embeddable format with mobile playback support */
function embedUrl(url: string): string {
  if (!url) return url;

  let videoId = "";

  // youtube.com/shorts/VIDEO_ID
  const shortsMatch = url.match(/(?:youtube\.com|youtu\.be)\/shorts\/([a-zA-Z0-9_-]+)/);
  if (shortsMatch) videoId = shortsMatch[1];

  // youtube.com/watch?v=VIDEO_ID
  if (!videoId) {
    const watchMatch = url.match(/(?:youtube\.com|youtu\.be)\/watch\?v=([a-zA-Z0-9_-]+)/);
    if (watchMatch) videoId = watchMatch[1];
  }

  // youtu.be/VIDEO_ID
  if (!videoId) {
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) videoId = shortMatch[1];
  }

  // Already an embed URL
  if (!videoId) {
    const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
    if (embedMatch) videoId = embedMatch[1];
  }

  if (!videoId) return url;

  return `https://www.youtube.com/embed/${videoId}?{/*playsinline*/} as any=1&rel=0`;
}

export default function InstallationMedia({ media }: { media: MediaItem[] }) {
  const [active, setActive] = useState(0);
  if (!media || media.length === 0) return null;

  const current = media[active];

  return (
    <div className="mb-16">
      <h3 className="text-xl text-white tracking-wide mb-6">📐 Installation</h3>
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
      <div className="bg-deep-blue/20 border border-silver/10 rounded-xl overflow-hidden">
        {current.type === "image" && (
          <img src={cdnUrl(current.url)} alt={current.label} width={800} height={400} className="w-full object-contain max-h-[300px]" />
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
            <iframe
              src={embedUrl(current.url)}
              className="w-full h-full"
              allowFullScreen

              title={current.label}
              loading="lazy"
            />
          </div>
        )}
      </div>
    </div>
  );
}
