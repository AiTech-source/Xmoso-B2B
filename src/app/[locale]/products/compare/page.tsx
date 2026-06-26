"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Breadcrumbs from "@/components/layout/Breadcrumbs";

interface Spec { label: string; value: string; sort_order: number; bgColor?: string; fontSize?: string; color?: string; }
interface CompareProduct {
  id: string; model_number: string; image: string; name: string;
  slug: string; description: string; product_style: string;
  highlights: string[]; energy_rating: string; specs: Spec[];
}

export default function ComparePage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const [products, setProducts] = useState<CompareProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollIdx, setScrollIdx] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [slugs, setSlugs] = useState<string[]>([]);
  const headerRef = useRef<HTMLDivElement>(null);
  const [stickyTop, setStickyTop] = useState(-9999);

  useEffect(() => {
    let found: string[] = [];
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const raw = p.get("slugs"); found = raw ? raw.split(",").filter(Boolean) : [];
    }
    setSlugs(found);
    try { localStorage.removeItem("compare_slugs"); window.dispatchEvent(new CustomEvent("compare-update")); } catch {}
  }, []);

  useEffect(() => {
    if (!slugs.length || slugs.length < 2) { setLoading(false); return; }
    setLoading(true);
    fetch(`/api/product-compare?slugs=${encodeURIComponent(slugs.join(","))}&locale=${locale}`)
      .then((r) => r.json()).then((data) => { setProducts(data.products || []); setLoading(false); }).catch(() => setLoading(false));
  }, [slugs, locale]);

  useEffect(() => {
    const el = carouselRef.current; if (!el) return;
    const handler = () => { setScrollIdx(Math.min(products.length - 1, Math.max(0, Math.round(el.scrollLeft / el.clientWidth) || 0))); };
    el.addEventListener("scroll", handler); return () => el.removeEventListener("scroll", handler);
  }, [products]);

  /** Track when the table header enters/leaves the sticky zone */
  useEffect(() => {
    function onScroll() {
      if (headerRef.current) {
        const top = headerRef.current.getBoundingClientRect().top;
        setStickyTop(top);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [products]);

  const t = (en: string, zh: string) => locale === "zh" ? zh : en;
  const allLabels: string[] = []; const seen = new Set<string>();
  if (products[0]?.specs) { for (const s of products[0].specs) { allLabels.push(s.label); seen.add(s.label); } }
  for (const p of products) { for (const s of p.specs) { if (!seen.has(s.label)) { allLabels.push(s.label); seen.add(s.label); } } }
  const specLookups = products.map((p) => { const map = new Map<string, any>(); for (const s of p.specs) map.set(s.label, s); return map; });

  function clearCompare() {
    try { localStorage.removeItem("compare_slugs"); window.dispatchEvent(new CustomEvent("compare-update")); } catch {}
    router.push(`/${locale}/products`);
  }

  const showSticky = stickyTop < 80;

  if (loading) return (<><Header /><main style={{ paddingTop: "64px" }}><div className="max-w-7xl mx-auto px-4 py-20 text-center text-silver/40">{t("Loading...", "加载中...")}</div></main><Footer /></>);
  if (!slugs.length || products.length < 2) return (
    <><Header /><main style={{ paddingTop: "64px" }}><div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <p className="text-silver/40 text-sm mb-4">{t("Select 2+ products.", "请选择2款以上产品进行对比。")}</p>
      <Link href={`/${locale}/products`} className="text-forest underline text-sm">{t("Browse", "浏览产品")}</Link>
    </div></main><Footer /></>
  );

  return (
    <>
      <Header />
      <main style={{ paddingTop: "64px" }} className="min-h-screen">
        <Breadcrumbs items={[{ label: t("Products", "产品中心"), href: `/${locale}/products` }, { label: t("Compare", "对比") }]} />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-light tracking-wider text-white">{t("Compare Products", "产品对比")}</h1>
            <button onClick={clearCompare} className="text-xs text-silver/40 hover:text-red-400">✕ {t("Clear", "清除")}</button>
          </div>

          {/* Desktop images */}
          <div className="hidden md:flex gap-6 mb-2">
            <div className="w-32 shrink-0" />
            {products.map((p) => (
              <div key={p.id} className="flex-1 min-w-0 text-center">
                <Link href={`/${locale}/products/${p.slug}`}>
                  <div className="aspect-[4/3] bg-[#f5f0e8] rounded-xl overflow-hidden border border-silver/10 flex items-center justify-center">
                    <img src={p.image} alt={p.name} loading="lazy" className="w-full h-full object-contain p-4" />
                  </div>
                </Link>
                <p className="text-sm mt-2" style={{color:"#ffffff"}}>{p.name}</p>
              </div>
            ))}
          </div>

          {/* Mobile carousel */}
          <div className="md:hidden relative mb-4">
            <div ref={carouselRef} className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: "none" }}>
              {products.map((p) => (
                <div key={p.id} className="snap-center shrink-0 w-[85vw]">
                  <Link href={`/${locale}/products/${p.slug}`}>
                    <div className="aspect-[4/3] bg-[#f5f0e8] rounded-xl overflow-hidden flex items-center justify-center border border-silver/10">
                      <img src={p.image} alt={p.name} loading="lazy" className="w-full h-full object-contain p-4" />
                    </div>
                  </Link>
                  <p className="text-center text-sm mt-2" style={{color:"#ffffff"}}>{p.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/*** Fixed overlay bar — shows when scrolling down ***/}
          {showSticky && (
            <div className="fixed top-20 left-0 right-0 z-40 bg-[#1A1A2E]/95 backdrop-blur-md border-b border-silver/10 shadow-lg py-3 px-4 md:px-8 overflow-x-auto">
              <div className="max-w-7xl mx-auto flex gap-6" style={{ minWidth: products.length * 200 + 40 }}>
                <div className="w-32 shrink-0 hidden md:block" />
                {products.map((p) => (
                  <div key={p.id} className="flex-1 min-w-[180px] text-center" style={{color:"#ffffff"}}>{p.name}</div>
                ))}
              </div>
            </div>
          )}

          {/* Spec table */}
          <div ref={headerRef} className="mt-4 border border-silver/10 rounded-xl overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: `${products.length * 200 + 140}px` }}>
              <thead>
                <tr>
                  <th className="w-32 hidden md:table-cell p-3 border-b border-silver/10 bg-[#1A1A2E]" />
                  {products.map((p) => (
                    <th key={p.id} className="p-3 text-center min-w-[180px] border-b border-silver/10 bg-[#1A1A2E]">
                      <div style={{color:"#ffffff"}} className="text-sm">{p.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allLabels.map((label, i) => (
                  <tr key={label} className={i % 2 === 0 ? "bg-row-even" : "bg-row-odd"}>
                    <td className="p-3 text-sm font-medium align-middle border-b border-silver/5 w-32 hidden md:table-cell" style={{color:"#0A0A0F"}}>
                      {label}
                    </td>
                    {products.map((p, pi) => {
                      const spec = specLookups[pi]?.get(label);
                      const cs: React.CSSProperties = {};
                      if (spec?.bgColor) cs.backgroundColor = spec.bgColor;
                      if (spec?.fontSize) cs.fontSize = `${spec.fontSize}px`;
                      if (spec?.color) cs.color = spec.color;
                      else if (spec?.bgColor) {
                        const n = spec.bgColor.match(/\d+/g);
                        if (n && n.length >= 3) { const avg = (Number(n[0])+Number(n[1])+Number(n[2]))/3; cs.color = avg > 160 ? "#0A0A0F" : "#ffffff"; }
                        else cs.color = "#0A0A0F";
                      } else cs.color = "#0A0A0F";
                      return (
                        <td key={p.id} className="p-3 text-center align-middle border-b border-silver/5 min-w-[180px]" style={cs}>
                          <span className="md:hidden block text-[11px] font-medium text-[#009f4b] mb-0.5">{label}</span>
                          {spec?.value || <span className="text-gray-400">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-center mt-10 mb-8 flex flex-wrap items-center justify-center gap-4">
            <Link href={`/${locale}/products`} className="px-8 py-3 border border-forest/40 text-forest rounded-full text-sm tracking-wider hover:bg-forest/10 transition-all">
              ← {t("Back", "返回")}
            </Link>
            <button onClick={clearCompare} className="px-8 py-3 border border-red-400/30 text-red-400/60 rounded-full text-sm tracking-wider hover:bg-red-400/5 hover:text-red-400 transition-all">
              ✕ {t("Clear", "清除对比")}
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
