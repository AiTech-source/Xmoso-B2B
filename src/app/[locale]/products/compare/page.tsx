"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Breadcrumbs from "@/components/layout/Breadcrumbs";

interface Spec {
  label: string; value: string; sort_order: number;
  bgColor?: string; fontSize?: string; color?: string;
}

interface CompareProduct {
  id: string; model_number: string; image: string; name: string;
  slug: string; description: string; product_style: string;
  highlights: string[]; energy_rating: string; specs: Spec[];
}

function useSlugs(): string {
  const [slugs, setSlugs] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      setSlugs(p.get("slugs") || "");
    }
  }, []);
  return slugs;
}

export default function ComparePage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const slugs = useSlugs();
  const [products, setProducts] = useState<CompareProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollIdx, setScrollIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slugs) { setLoading(false); return; }
    setLoading(true);
    fetch(`/api/product-compare?slugs=${encodeURIComponent(slugs)}&locale=${locale}`)
      .then((r) => r.json())
      .then((data) => { setProducts(data.products || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slugs, locale]);

  const t = (en: string, zh: string) => locale === "zh" ? zh : en;
  const colCount = products.length;

  const allLabels: string[] = [];
  const seen = new Set<string>();
  if (products[0]?.specs) {
    for (const s of products[0].specs) { allLabels.push(s.label); seen.add(s.label); }
  }
  for (const p of products) {
    for (const s of p.specs) { if (!seen.has(s.label)) { allLabels.push(s.label); seen.add(s.label); } }
  }

  const specLookups = products.map((p) => {
    const map = new Map<string, any>();
    for (const s of p.specs) map.set(s.label, s);
    return map;
  });

  if (loading) {
    return (
      <>
        <Header />
        <main style={{ paddingTop: "64px" }}>
          <div className="max-w-7xl mx-auto px-4 py-20 text-center text-silver/40">{t("Loading...", "加载中...")}</div>
        </main>
        <Footer />
      </>
    );
  }

  if (!slugs || products.length < 2) {
    return (
      <>
        <Header />
        <main style={{ paddingTop: "64px" }}>
          <div className="max-w-7xl mx-auto px-4 py-20 text-center">
            <p className="text-silver/40 text-sm mb-4">{t("Select 2+ products to compare.", "请选择2款以上产品进行对比。")}</p>
            <Link href={`/${locale}/products`} className="text-forest underline text-sm">{t("Browse products", "浏览产品")}</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const gridCols = colCount === 2 ? "md:grid-cols-2" : colCount === 3 ? "md:grid-cols-3" : "md:grid-cols-4";

  return (
    <>
      <Header />
      <main style={{ paddingTop: "64px" }} className="min-h-screen">
        <Breadcrumbs items={[{ label: t("Products", "产品中心"), href: `/${locale}/products` }, { label: t("Compare", "对比") }]} />

        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-light tracking-wider text-white mb-8">{t("Compare Products", "产品对比")}</h1>

          {/* ── Desktop: images in grid ── */}
          <div className={`grid ${gridCols} gap-4 mb-0 max-md:hidden`}>
            {products.map((p) => (
              <div key={p.id} className="text-center">
                <Link href={`/${locale}/products/${p.slug}`}>
                  <div className="aspect-[4/3] bg-[#f5f0e8] rounded-xl overflow-hidden border border-silver/10 hover:border-forest/30 transition-colors flex items-center justify-center">
                    {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-contain p-4" /> : <span className="text-6xl text-silver/20">🍷</span>}
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {/* ── Mobile: image carousel ── */}
          <div className="md:hidden relative">
            <div ref={scrollRef}
              onScroll={() => {
                if (!scrollRef.current) return;
                const idx = Math.round(scrollRef.current.scrollLeft / scrollRef.current.clientWidth);
                setScrollIdx(Math.min(products.length - 1, Math.max(0, idx)));
              }}
              className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {products.map((p) => (
                <div key={p.id} className="snap-center shrink-0 w-[85vw]">
                  <Link href={`/${locale}/products/${p.slug}`}>
                    <div className="aspect-[4/3] bg-[#f5f0e8] rounded-xl overflow-hidden border border-silver/10 flex items-center justify-center">
                      {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-contain p-4" /> : <span className="text-6xl text-silver/20">🍷</span>}
                    </div>
                  </Link>
                  <p className="text-center text-sm text-white mt-2">{p.model_number} — {p.name}</p>
                </div>
              ))}
            </div>
            {products.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-3">
                {products.map((_, i) => (
                  <button key={i} onClick={() => scrollRef.current?.children[i]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })}
                    className={`w-2 h-2 rounded-full transition-all cursor-pointer ${scrollIdx === i ? "bg-forest w-4" : "bg-silver/30"}`} />
                ))}
              </div>
            )}
          </div>

          {/* ── Sticky model names ── */}
          <div className="sticky top-20 z-30 -mx-4 px-4 py-3 bg-[#1A1A2E]/95 backdrop-blur-md border-b border-silver/10 shadow-lg mb-0 mt-4">
            <div className={`grid ${gridCols} gap-4 max-md:grid-cols-1`}>
              {products.map((p) => (
                <div key={p.id} className="text-center">
                  <div className="text-xs text-white/70">{p.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Spec rows ── */}
          <div>
            {allLabels.map((label, i) => (
              <div key={label} className={`group relative ${i % 2 === 0 ? "bg-row-even" : "bg-row-odd"}`}>
                {/* Desktop hover label */}
                <div className="max-md:hidden absolute -top-2.5 left-0 z-10 select-none pointer-events-none">
                  <span className="inline-block text-[10px] font-medium tracking-wide text-white bg-deep-blue px-2 py-0.5 rounded-sm shadow-sm border border-silver/10 transition-opacity duration-200">
                    {label}
                  </span>
                </div>
                <div className={`grid ${gridCols} gap-x-4 py-2.5 px-2 -mx-2 border-b border-silver/5 max-md:grid-cols-1`}>
                  {/* Mobile label */}
                  <div className="md:hidden text-[11px] font-medium mb-0.5 tracking-wide text-[#2a7d4e]">{label}</div>
                  {products.map((p, pi) => {
                    const spec = specLookups[pi].get(label);
                    const cellStyle: React.CSSProperties = {};
                    if (spec?.bgColor) cellStyle.backgroundColor = spec.bgColor;
                    if (spec?.fontSize) cellStyle.fontSize = `${spec.fontSize}px`;
                    if (spec?.color) {
                      cellStyle.color = spec.color;
                    } else if (spec?.bgColor) {
                      const m = spec.bgColor.match(/\d+/g);
                      if (m && m.length >= 3) {
                        const avg = (Number(m[0]) + Number(m[1]) + Number(m[2])) / 3;
                        cellStyle.color = avg > 160 ? "#0A0A0F" : "#ffffff";
                      } else cellStyle.color = "#0A0A0F";
                    } else cellStyle.color = "#0A0A0F";
                    return (
                      <div key={p.id} className="text-sm leading-relaxed" style={cellStyle}>
                        {spec?.value || <span className="text-gray-400">—</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12 mb-8">
            <Link href={`/${locale}/products`} className="inline-block px-8 py-3 border border-forest/40 text-forest rounded-full text-sm tracking-wider hover:bg-forest/10 transition-all">
              ← {t("Back to Products", "返回产品页")}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
