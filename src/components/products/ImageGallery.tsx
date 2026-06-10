"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GalleryImage {
  url: string;
  alt?: string;
}

export default function ImageGallery({ images }: { images: GalleryImage[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zooming, setZooming] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLDivElement>(null);

  if (!images || images.length === 0) {
    return (
      <div className="bg-deep-blue/20 rounded-xl aspect-square flex items-center justify-center">
        <span className="text-8xl text-silver/20">🍷</span>
      </div>
    );
  }

  const img = images[activeIndex];

  function handleMouseMove(e: React.MouseEvent) {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPos({ x, y });
  }

  return (
    <div className="space-y-4">
      {/* Main image with lens zoom */}
      <div
        ref={imgRef}
        className="relative bg-deep-blue/20 rounded-xl overflow-hidden aspect-square cursor-crosshair group"
        onMouseEnter={() => setZooming(true)}
        onMouseLeave={() => setZooming(false)}
        onMouseMove={handleMouseMove}
      >
        {/* Thumbnail version shown to user */}
        <img
          src={img.url}
          alt={img.alt || "Product image"}
          className="w-full h-full object-contain p-4"
        />

        {/* Zoom lens — circular magnifier following cursor */}
        {zooming && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${img.url})`,
              backgroundSize: "250%",
              backgroundPosition: `${pos.x}% ${pos.y}%`,
              clipPath: `circle(100px at ${pos.x}% ${pos.y}%)`,
              WebkitClipPath: `circle(100px at ${pos.x}% ${pos.y}%)`,
            }}
          />
        )}

        {/* Hint */}
        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-deep-dark/60 text-white/60 text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          🔍
        </div>

        {/* Prev/Next arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setActiveIndex(i => (i - 1 + images.length) % images.length); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-deep-dark/60 text-white flex items-center justify-center hover:bg-deep-dark/80 transition-colors opacity-0 group-hover:opacity-100"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setActiveIndex(i => (i + 1) % images.length); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-deep-dark/60 text-white flex items-center justify-center hover:bg-deep-dark/80 transition-colors opacity-0 group-hover:opacity-100"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Thumbnails at the bottom */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                i === activeIndex ? "border-forest" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
