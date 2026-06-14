"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Breadcrumbs from "@/components/layout/Breadcrumbs";

interface CompareProduct {
  id: string;
  model_number: string;
  image: string;
  name: string;
  slug: string;
  description: string;
  product_style: string;
  highlights: string[];
  energy_rating: string;
  specs: Array<{
    label: string;
    value: string;
    sort_order: number;
    bgColor?: string;
    fontSize?: string;
    color?: string;
  }>;
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
      .then((data) => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slugs, locale]);

  const t = (en: string, zh: string) => locale === "zh" ? zh : en;

  if (loading) {
    return (
      <>
        <Header />
        <main style={{ paddingTop: "64px" }}>
          <div className="max-w-7xl mx-auto px-4 py-20 text-center text-silver/40">
            {t("Loading...", "加载中...")}
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!slugs || products.length === 0) {
    return (
      <>
        <Header />
        <main style={{ paddingTop: "64px" }}>
          <div className="max-w-7xl mx-auto px-4 py-20 text-center">
            <p className="text-silver/40 text-sm mb-4">{t("No products selected for comparison.", "未选择要比较的产品。")}</p>
            <Link href={`/${locale}/products`} className="text-forest hover:text-forest/80 text-sm underline">
              {t("Browse products", "浏览产品")}
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Build spec matrix
  const allLabels: string[] = [];
  const seen = new Set<string>();
  if (products[0]?.specs) {
    for (const s of products[0].specs) {
      allLabels.push(s.label);
      seen.add(s.label);
    }
  }
  for (const p of products) {
    for (const s of p.specs) {
      if (!seen.has(s.label)) {
        allLabels.push(s.label);
        seen.add(s.label);
      }
    }
  }

  const specLookups = products.map((p) => {
    const map = new Map<string, any>();
    for (const s of p.specs) map.set(s.label, s);
    return map;
  });

  return (
    <>
      <Header />
      <main style={{ paddingTop: "64px" }} className="min-h-screen">
        <Breadcrumbs items={[{ label: t("Products", "产品中心"), href: `/${locale}/products` }, { label: t("Compare", "对比") }]} />

        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-light tracking-wider text-white mb-2">
            📊 {t("Product Comparison", "产品对比")}
          </h1>
          <p className="text-xs text-silver/40 mb-8">
            {products.length} {t("products", "款产品")}
          </p>

          {/* ── Image + Name Row (sticky on scroll) ── */}
          <div className="sticky top-20 z-20 -mx-4 px-4 pb-4 mb-4 bg-[#0A0A0F] border-b border-silver/10 shadow-lg shadow-black/30">
            <div className="flex gap-4 overflow-x-auto">
              <div className="w-32 shrink-0 flex items-end pb-4">
                <span className="text-xs text-silver/40 uppercase tracking-wider">{t("Product", "产品")}</span>
              </div>
              {products.map((p) => (
                <Link key={p.id} href={`/${locale}/products/${p.slug}`}
                  className="flex-1 min-w-[180px] group text-center">
                  <div className="aspect-square bg-[#f5f0e8] border border-silver/10 rounded-xl overflow-hidden mb-3 group-hover:border-forest/30 transition-colors">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-contain p-3" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><span className="text-4xl text-silver/20">🍷</span></div>
                    )}
                  </div>
                  <h3 className="text-sm text-white font-medium tracking-wide leading-snug line-clamp-2">{p.name}</h3>
                  <p className="text-xs text-silver/50 mt-1">{p.model_number}</p>
                  {p.product_style && (
                    <p className="text-xs text-forest mt-0.5">{p.product_style}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* ── Spec Matrix Table ── */}
          {allLabels.length > 0 && (
            <div className="bg-deep-blue/20 border border-silver/10 rounded-xl overflow-x-auto">
              <p className="text-[10px] text-silver/30 text-center py-1.5 md:hidden">← {t("Scroll horizontally", "左右滑动")} →</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-silver/10">
                    <th className="text-left p-4 text-xs text-silver/50 uppercase tracking-wider font-medium w-48 sticky left-0 bg-deep-blue z-10">
                      {t("Specification", "规格")}
                    </th>
                    {products.map((p) => (
                      <th key={p.id} className="p-4 text-center text-xs text-silver/50 uppercase tracking-wider font-medium min-w-[160px]">
                        {p.model_number}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allLabels.map((label, i) => (
                    <tr key={label} className={`border-b border-silver/5 ${i % 2 === 0 ? "bg-[#0E0E1A]" : "bg-[#0A0A14]"}`}>
                      <td className="p-4 text-white/80 text-xs font-medium sticky left-0 bg-[#0A0A0F] z-10 border-r border-silver/10">
                        {label}
                      </td>
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
                            cellStyle.color = avg > 160 ? "#0A0A0F" : "rgba(255,255,255,0.85)";
                          } else {
                            cellStyle.color = "rgba(255,255,255,0.75)";
                          }
                        } else {
                          cellStyle.color = "rgba(255,255,255,0.75)";
                        }
                        return (
                          <td key={p.id} className="p-4 text-center text-xs" style={cellStyle}>
                            {spec?.value || <span className="text-silver/20">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Back link ── */}
          <div className="text-center mt-10">
            <Link href={`/${locale}/products`}
              className="inline-block px-8 py-3 border border-forest/40 text-forest rounded-full text-sm tracking-wider hover:bg-forest/10 transition-all">
              ← {t("Back to Products", "返回产品页")}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
