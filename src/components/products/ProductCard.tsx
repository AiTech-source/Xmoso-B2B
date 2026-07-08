"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { cdnUrl } from "@/lib/cdn";

interface ProductCardProps {
  slug: string; name: string; image: string; locale: string;
  highlights: string[]; productStyle: string;
  selectable?: boolean;
}

const MAX_COMPARE = 4;
const STORAGE_KEY = "compare_slugs";

function getCompareSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? raw.split(",").filter(Boolean) : [];
  } catch { return []; }
}

function setCompareSlugs(slugs: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, slugs.join(","));
    window.dispatchEvent(new CustomEvent("compare-update"));
  } catch {}
}

export default function ProductCard({ slug, name, image, locale, highlights, productStyle, selectable }: ProductCardProps) {
  const [selected, setSelected] = useState(false);
  const [maxReached, setMaxReached] = useState(false);
  const prefetched = useRef(false);

  // Prefetch product detail page on hover
  const handlePreload = useCallback(() => {
    if (prefetched.current) return;
    prefetched.current = true;
    try {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = `/${locale}/products/${slug}`;
      document.head.appendChild(link);
      setTimeout(() => link.remove(), 10000);
    } catch {}
  }, [locale, slug]);

  useEffect(() => {
    const slugs = getCompareSlugs();
    setSelected(slugs.includes(slug));
    setMaxReached(slugs.length >= MAX_COMPARE && !slugs.includes(slug));

    const handler = () => {
      const current = getCompareSlugs();
      setSelected(current.includes(slug));
      setMaxReached(current.length >= MAX_COMPARE && !current.includes(slug));
    };
    window.addEventListener("compare-update", handler);
    return () => window.removeEventListener("compare-update", handler);
  }, [slug]);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const slugs = getCompareSlugs();
    if (selected) {
      setCompareSlugs(slugs.filter((s) => s !== slug));
    } else if (slugs.length < MAX_COMPARE) {
      setCompareSlugs([...slugs, slug]);
    }
  }

  return (
    <Link href={`/${locale}/products/${slug}`}
      onMouseEnter={handlePreload} onTouchStart={handlePreload}
      className={`group block relative ${selectable && selected ? "ring-2 ring-forest/50 rounded-lg" : ""}`}>
      <div className="relative">
        {selectable && (
          <div className="absolute top-2 left-2 z-10" onClick={toggle}>
            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer ${
              selected ? "bg-forest border-forest" : maxReached
                ? "bg-black/20 border-silver/20 opacity-30 cursor-not-allowed"
                : "bg-black/30 border-white/20 hover:border-forest/60 hover:bg-black/40"
            }`}>
              {selected && <span className="text-deep-dark text-xs font-bold">✓</span>}
            </div>
          </div>
        )}

        <div className="aspect-[4/3] overflow-hidden rounded-sm border border-silver/10 group-hover:border-forest/30 transition-colors">
          {image ? (
            <img src={cdnUrl(image)} alt={name} width={400} height={300} loading="lazy"
              className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-700" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-deep-blue/20">
              <span className="text-silver/20 text-6xl">🍷</span>
            </div>
          )}
        </div>

        <div className="mt-4">
          <h3 className="text-[15px] text-white font-light tracking-wide leading-snug">{name}</h3>
          {productStyle && (
            <p className="text-[13px] text-forest mt-1 tracking-wider font-medium">{productStyle}</p>
          )}
        </div>

        {highlights.length > 0 && (
          <ul className="mt-2.5 space-y-0.5">
            {highlights.slice(0, 5).map((h, i) => (
              <li key={i} className="text-[13px] text-silver/60 leading-relaxed">{h}</li>
            ))}
          </ul>
        )}
      </div>
    </Link>
  );
}
