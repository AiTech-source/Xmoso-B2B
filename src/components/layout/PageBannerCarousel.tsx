"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { cdnUrl } from "@/lib/cdn";

interface BannerData {
  id: string;
  image_url: string;
  alt_text?: string | null;
  orientation?: string | null;
}

interface PageBannerCarouselProps {
  pageKey: string;
  vignette?: boolean;
  initialBanner?: BannerData | null;
  initialBanners?: BannerData[] | null;
}

export default function PageBannerCarousel({ pageKey, vignette = true, initialBanner, initialBanners }: PageBannerCarouselProps) {
  const [banners, setBanners] = useState<BannerData[]>(() => {
    if (initialBanners?.length) return initialBanners;
    return initialBanner ? [initialBanner] : [];
  });
  const [activeIdx, setActiveIdx] = useState(0);
  const [imgRendered, setImgRendered] = useState(false);
  const [hasFetchedAll, setHasFetchedAll] = useState(Boolean(initialBanners?.length));
  const paused = useRef(false);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetch(`/api/banners?page=${pageKey}`)
      .then((r) => r.json())
      .then((data) => {
        setBanners(data.banners || []);
        setHasFetchedAll(true);
      })
      .catch(() => setHasFetchedAll(true));
  }, [pageKey]);

  const landscapes = banners.filter((b) => b.orientation === "landscape" || !b.orientation);
  const portraits = banners.filter((b) => b.orientation === "portrait");
  const total = Math.max(landscapes.length || 1, portraits.length || 1);

  const currLandscape = landscapes[activeIdx % landscapes.length] || landscapes[0] || (hasFetchedAll ? banners[0] : undefined);
  const currPortrait = portraits[activeIdx % portraits.length] || portraits[0] || (hasFetchedAll ? banners[0] : undefined);
  const firstLoad = !imgRendered;

  const next = useCallback(() => setActiveIdx((a) => (a + 1) % total), [total]);

  useEffect(() => {
    if (total <= 1 || paused.current) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [total, next]);

  const renderImg = (banner: BannerData, initial: boolean) => (
    <img src={cdnUrl(banner.image_url + (banner.image_url?.includes("?") ? "&" : "?") + "w=1200&q=65")}
      alt={banner.alt_text || ""} width={1920} height={640}
      fetchPriority={initial ? "high" : "auto"}
      loading={initial ? "eager" : "lazy"}
      onLoad={() => { if (!imgRendered) setImgRendered(true); }}
      className={`w-full h-full object-cover ${vignette ? "img-vignette-strong" : ""}`}
      style={{ display: "block" }} />
  );

  return (
    <div className="relative w-full overflow-hidden bg-deep-dark"
      onMouseEnter={() => { paused.current = true; }}
      onMouseLeave={() => { paused.current = false; }}
    >
      <style>{`
        .banner-wrap { min-height: 200px; position: relative; }
        .banner-layer { position: absolute; inset: 0; }
        @media (max-width: 767px) {
          .banner-wrap { aspect-ratio: auto; height: 100dvh; max-height: 100dvh; }
          .banner-d { display: none !important; }
        }
        @media (min-width: 768px) {
          .banner-wrap { aspect-ratio: 3/1; max-height: 650px; }
          .banner-m { display: none !important; }
        }
      `}</style>

      <div className="banner-wrap w-full overflow-hidden">
        {/* Desktop: landscape */}
        <div className="banner-d banner-layer">
          {currLandscape?.image_url ? renderImg(currLandscape, firstLoad && landscapes.length > 0) : null}
        </div>

        {/* Mobile: portrait */}
        <div className="banner-m banner-layer">
          {currPortrait?.image_url ? renderImg(currPortrait, firstLoad && portraits.length > 0) : null}
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-deep-dark/70 via-transparent to-deep-dark/20 pointer-events-none" />

        {total > 1 && (
          <>
            <button aria-label="Previous slide" onClick={() => setActiveIdx((a) => (a - 1 + total) % total)}
              className="banner-arrow" style={{ left: "16px" }}>‹</button>
            <button aria-label="Next slide" onClick={next} className="banner-arrow" style={{ right: "16px" }}>›</button>
            <style>{`.banner-arrow{position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;z-index:10;font-size:24px;line-height:1;border-radius:50%;background:rgba(0,0,0,0.5);color:rgba(255,255,255,0.7)}.banner-arrow:hover{background:rgba(0,0,0,0.7)}`}</style>
            <div role="tablist" aria-label="Slide indicators" style={{ position: "absolute", bottom: "8px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "4px", zIndex: 10 }}>
              {Array.from({ length: total }).map((_, i) => (
                <button key={i} role="tab" aria-label={`Go to slide ${i + 1}`} aria-selected={i === (activeIdx % total)}
                  onClick={() => setActiveIdx(i)}
                  style={{ width: i === (activeIdx % total) ? "28px" : "12px", height: "12px", margin: "16px 4px", borderRadius: "6px", border: "none", cursor: "pointer", background: i === (activeIdx % total) ? "#009f4b" : "rgba(255,255,255,0.3)", transition: "all 0.3s", padding: 0 }} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
