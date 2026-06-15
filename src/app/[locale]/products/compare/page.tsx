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

  // Build spec matrix
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

  const gridAutoCols = colCount === 2 ? "repeat(2,1fr)" : colCount === 3 ? "repeat(3,1fr)" : "repeat(4,1fr)";

  return (
    <>
      <Header />
      <main style={{ paddingTop: "64px" }} className="min-h-screen">
        <Breadcrumbs items={[{ label: t("Products", "产品中心"), href: `/${locale}/products` }, { label: t("Compare", "对比") }]} />

        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-light tracking-wider text-white mb-8">📊 {t("Compare Products", "产品对比")}</h1>

          {/* ── Images — scroll out naturally ── */}
          <div className="grid gap-4 mb-0" style={{ gridTemplateColumns: gridAutoCols }}>
            {products.map((p) => (
              <div key={p.id} className="text-center">
                <Link href={`/${locale}/products/${p.slug}`}>
                  <div className="aspect-[4/3] bg-[#f5f0e8] border border-silver/10 rounded-xl overflow-hidden hover:border-forest/30 transition-colors flex items-center justify-center">
                    {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-contain p-4" /> : <span className="text-6xl text-silver/20">🍷</span>}
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {/* ── Sticky model names — appear when images scroll past ── */}
          <div className="sticky top-20 z-30 -mx-4 px-4 py-3 bg-[#0A0A0F]/95 backdrop-blur-md border-b border-silver/10 shadow-lg mb-0 mt-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: gridAutoCols }}>
              {products.map((p) => (
                <div key={p.id} className="text-center">
                  <span className="text-white font-medium text-sm">{p.model_number}</span>
                  <p className="text-xs text-silver/50 mt-0.5 line-clamp-1">{p.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Spec rows ── */}
          <div className="divide-y divide-silver/8">
            {/* Header spacer */}
            <div className="grid gap-4 py-3 text-[11px] text-silver/40 uppercase tracking-wider" style={{ gridTemplateColumns: gridAutoCols }}>
              {products.map((p) => <div key={p.id}>{t("Specifications", "规格参数")}</div>)}
            </div>

            {allLabels.map((label, i) => (
              <div key={label} className={`grid gap-4 py-3.5 ${i % 2 === 0 ? "" : "bg-white/[0.015]"}`} style={{ gridTemplateColumns: gridAutoCols }}>
                {products.map((p, pi) => {
                  const spec = specLookups[pi].get(label);
                  const cellStyle: React.CSSProperties = {};
                  if (spec?.bgColor) cellStyle.backgroundColor = spec.bgColor;
                  if (spec?.fontSize) cellStyle.fontSize = `${spec.fontSize}px`;
                  if (spec?.color) cellStyle.color = spec.color;
                  else if (spec?.bgColor) {
                    const m = spec.bgColor.match(/\d+/g);
                    if (m && m.length >= 3) {
                      const avg = (Number(m[0]) + Number(m[1]) + Number(m[2])) / 3;
                      cellStyle.color = avg > 160 ? "#0A0A0F" : "rgba(255,255,255,0.85)";
                    } else cellStyle.color = "rgba(255,255,255,0.75)";
                  } else cellStyle.color = "rgba(255,255,255,0.75)";
                  return (
                    <div key={p.id} className="flex flex-col gap-0.5">
                      {/* Label only on mobile */}
                      <span className="md:hidden text-[10px] text-silver/40 tracking-wider">{label}</span>
                      <span className="text-sm" style={cellStyle}>{spec?.value || <span className="text-silver/30">—</span>}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* ── Back link ── */}
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
