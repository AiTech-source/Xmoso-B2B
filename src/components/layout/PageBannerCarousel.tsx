"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";

interface PageBannerCarouselProps {
  pageKey: string;
  vignette?: boolean;
}

export default function PageBannerCarousel({ pageKey, vignette = true }: PageBannerCarouselProps) {
  const [banners, setBanners] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [active, setActive] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    fetch(`/api/banners?page=${pageKey}`)
      .then((r) => r.json())
      .then((data) => setBanners(data.banners || []))
      .catch(() => {});
  }, [pageKey]);

    // Preferred orientation first, fallback to all
  let visibleBanners = banners;
  const preferred = banners.filter((b) => b.orientation === (isMobile ? "portrait" : "landscape"));
  if (preferred.length > 0) visibleBanners = preferred;
  const safeActive = visibleBanners.length > 0 ? active % visibleBanners.length : 0;

  const next = useCallback(() => {
    setActive((a) => (a + 1) % Math.max(visibleBanners.length, 1));
  }, [visibleBanners.length]);

  useEffect(() => {
    if (visibleBanners.length <= 1 || paused.current) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [visibleBanners.length, next]);

  if (visibleBanners.length === 0) return <div style={{ height: "200px" }} />;

  const current = visibleBanners[safeActive];

  return (
    <div className="relative w-full overflow-hidden bg-deep-dark"
      style={{ aspectRatio: isMobile ? "auto" : "3/1", height: isMobile ? "100dvh" : undefined, maxHeight: isMobile ? undefined : "650px", minHeight: "200px" }}
      onMouseEnter={() => { paused.current = true; }}
      onMouseLeave={() => { paused.current = false; }}
    >
      <motion.div
        key={current.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        {current.image_url ? (
          <img src={current.image_url} alt={current.alt_text || ""}
            className={`w-full h-full object-cover ${vignette ? "img-vignette-strong" : ""}`} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-deep-blue/60 to-deep-dark">
            <span className="text-6xl opacity-20">🖼</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-deep-dark/70 via-transparent to-deep-dark/20 pointer-events-none" />
      </motion.div>

      {visibleBanners.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); setActive((a) => (a - 1 + visibleBanners.length) % visibleBanners.length); }}
            style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", width: "40px", height: "40px", borderRadius: "50%", background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", zIndex: 10 }}>‹</button>
          <button onClick={(e) => { e.stopPropagation(); setActive((a) => (a + 1) % visibleBanners.length); }}
            style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", width: "40px", height: "40px", borderRadius: "50%", background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", zIndex: 10 }}>›</button>
          <div style={{ position: "absolute", bottom: "16px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "8px", zIndex: 10 }}
            onClick={(e) => e.stopPropagation()}>
            {visibleBanners.map((_, i) => (
              <button key={i} onClick={() => setActive(i)}
                style={{ width: i === safeActive ? "24px" : "8px", height: "8px", borderRadius: "4px", border: "none", cursor: "pointer", background: i === safeActive ? "#8BC8A0" : "rgba(255,255,255,0.3)", transition: "all 0.3s" }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
