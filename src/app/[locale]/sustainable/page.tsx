import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import PageBannerCarousel from "@/components/layout/PageBannerCarousel";
import PageContentRenderer from "@/components/layout/PageContentRenderer";
import AnimateSection from "@/components/layout/AnimateSection";
import FloatingInquiry from "@/components/products/FloatingInquiry";
import FaqAccordion from "@/components/products/FaqAccordion";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { organizationSchema, faqPageSchema, breadcrumbListSchema, renderJsonLd } from "@/lib/seo/json-ld";
import { ogImageUrl, getOgSettings } from "@/lib/seo/og";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const supabase = await createServerSupabaseClient();
  const ogSettings = await getOgSettings(supabase);
  let title = locale === "zh" ? "可持续发展 — 负碳红酒柜制造商" : "Sustainability — Carbon-Negative Wine Coolers | XMOSO";
  let desc = locale === "zh" ? "XMOSO 使用生物基材、毛竹固碳技术，生产负碳红酒柜。EN 15804 生命周期评估。" : "XMOSO manufactures carbon-negative wine coolers using bio-based Moso materials. EN 15804 LCA verified.";
  if (supabase) {
    const { data } = await supabase.from("page_contents").select("seo_title, seo_description").eq("page_key", "sustainable").eq("locale", locale).maybeSingle();
    if (data?.seo_title) title = data.seo_title;
    if (data?.seo_description) desc = data.seo_description;
  }
  const ogUrl = ogImageUrl({ title, type: "page", brand: ogSettings.brand });
  return { title, description: desc, alternates: { canonical: locale === "en" ? "/sustainable" : `/${locale}/sustainable` }, openGraph: { type: "website", title, description: desc, images: [{ url: ogUrl }] } };
}

export default async function SustainablePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createServerSupabaseClient();
  const isZh = locale === "zh";

  let pageData: any = null;
  if (supabase) {
    const { data } = await supabase.from("page_contents").select("*").eq("page_key", "sustainable").eq("locale", locale).maybeSingle();
    pageData = data;
  }
  const sd = pageData?.content?.sustainableData || {};

  function val(obj: any, key: string, fallback: string) { return obj?.[key] ? obj[key] : fallback; }

  return (
    <>
      <Header />
      <main style={{ paddingTop: "64px" }}>
        <PageBannerCarousel pageKey="sustainable" vignette />
        <Breadcrumbs items={[{ label: isZh ? "可持续发展" : "Sustainability", href: `/${locale}/sustainable` }]} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: renderJsonLd(organizationSchema("XMOSO", "https://xmoso.com")) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: renderJsonLd(breadcrumbListSchema([{ name: isZh ? "可持续发展" : "Sustainability", url: `https://xmoso.com${isZh ? "/zh" : ""}/sustainable` }])) }} />

        <div className="max-w-7xl mx-auto px-4">

          {/* HERO */}
          <section className="py-20 md:py-28 text-center border-b border-silver/10">
            <h1 className="text-3xl md:text-5xl font-light tracking-wider text-white leading-tight">
              {pageData?.title || (isZh ? "珍存佳酿，守护地球" : "Preserving Wine. Protecting the Planet.")}
            </h1>
            <p className="text-silver/50 text-sm md:text-base mt-6 max-w-3xl mx-auto leading-relaxed">
              {pageData?.subtitle || (isZh
                ? "我们将现代制冷技术与负碳循环设计相结合。基于 EN 15804 审计的生物基材料冷却系统，满足最严格的全球 ESG 标准。"
                : "We bridge modern refrigeration with circular bio-material architecture. Backed by rigorous EN 15804 auditing, our bio-based cooling systems meet the world's strictest ESG standards.")}
            </p>
          </section>

          {/* INTUITIVE HIGHLIGHT — factory gate offset */}
          {sd.factoryGate && <section className="py-16 border-b border-silver/10 bg-gradient-to-r from-deep-blue/40 to-transparent">
            <div className="max-w-4xl mx-auto text-center">
              <div className="bg-deep-dark/60 border border-forest/20 rounded-2xl p-8 md:p-12">
                <span className="text-5xl block mb-4">🏭</span>
                <p className="text-xl md:text-2xl font-light text-white leading-relaxed" dangerouslySetInnerHTML={{ __html: sd.factoryGate }} />
                {sd.factoryGateSub && <p className="text-silver/50 text-sm mt-4">{sd.factoryGateSub}</p>}
              </div>
            </div>
          </section>}

          {/* METRICS */}
          {(sd.metrics?.length > 0) && <section className="py-16 border-b border-silver/10">
            <h2 className="text-2xl font-light tracking-wider text-forest text-center mb-12">{isZh ? "核心环保指标" : "Environmental Impact Metrics"}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {sd.metrics.map((item: any, i: number) => (
                <div key={i} className="bg-deep-blue/20 border border-silver/10 rounded-xl p-6 text-center hover:border-forest/30 transition-colors">
                  <p className="text-3xl md:text-4xl font-light text-forest">{item.value}</p>
                  <p className="text-xs text-forest/60 tracking-wider uppercase mt-1">{item.unit}</p>
                  <p className="text-white text-sm font-medium mt-4">{item.label}</p>
                  <p className="text-silver/50 text-xs mt-1">{item.sub}</p>
                </div>
              ))}
            </div>
          </section>}

          {/* STORIES — forest + project */}
          {(sd.forestStory || sd.projectStory) && <section className="py-16 border-b border-silver/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
              <div>
                {sd.forestStory && <div className="bg-deep-blue/20 border border-silver/10 rounded-xl p-6 mb-6">
                  <span className="text-3xl block mb-3">🌳</span>
                  <p className="text-white text-sm font-medium mb-2">{isZh ? "每台 145DB 酒柜" : "Each 145DB Wine Cooler"}</p>
                  <p className="text-silver/60 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: sd.forestStory }} />
                </div>}
                {sd.projectStory && <div className="bg-deep-blue/20 border border-forest/20 rounded-xl p-6">
                  <span className="text-3xl block mb-3">🏗️</span>
                  <p className="text-white text-sm font-medium mb-2">{isZh ? "大型项目减碳奇迹" : "Large Project Carbon Impact"}</p>
                  <p className="text-silver/60 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: sd.projectStory }} />
                </div>}
              </div>
              <div className="bg-deep-blue/20 border border-silver/10 rounded-xl p-8 text-center md:mt-0 mt-6">
                <span className="text-7xl block mb-4">🎋</span>
                <p className="text-forest text-lg font-light tracking-wide">{isZh ? "负碳材料" : "Carbon-Negative Material"}</p>
                <p className="text-silver/50 text-xs mt-2">{isZh ? "EN 16485 认证可再生生物基材" : "EN 16485 Certified Renewable Bio-Material"}</p>
              </div>
            </div>
          </section>}

          {/* PRODUCT DATA */}
          {(sd.model145?.cards?.length > 0 || sd.model90?.cards?.length > 0) && <section className="py-16 border-b border-silver/10">
            <h2 className="text-2xl font-light tracking-wider text-white text-center mb-12">{isZh ? "产品环保数据" : "Product Sustainability Data"}</h2>
            {sd.model145?.cards?.length > 0 && <div className="bg-deep-blue/20 border border-forest/20 rounded-xl p-6 md:p-8 mb-6">
              <h3 className="text-lg text-forest font-medium tracking-wide mb-6">{sd.model145.title || "XFS145DB"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{sd.model145.cards.map((c: any, i: number) => (
                <div key={i} className="bg-deep-dark/40 border border-silver/10 rounded-lg p-5">
                  <span className="text-2xl">{c.icon}</span>
                  <p className="text-white text-sm font-medium mt-3 mb-1">{c.title}</p>
                  <p className="text-silver/50 text-xs leading-relaxed">{c.desc}</p>
                  {c.badge && <span className="inline-block mt-3 text-[10px] px-2 py-0.5 rounded-full bg-forest/15 text-forest">{c.badge}</span>}
                </div>
              ))}</div>
            </div>}
            {sd.model90?.cards?.length > 0 && <div className="bg-deep-blue/20 border border-silver/10 rounded-xl p-6 md:p-8">
              <h3 className="text-lg text-forest font-medium tracking-wide mb-6">{sd.model90.title || "XBC90DB"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{sd.model90.cards.map((c: any, i: number) => (
                <div key={i} className="bg-deep-dark/40 border border-silver/10 rounded-lg p-5">
                  <span className="text-2xl">{c.icon}</span>
                  <p className="text-white text-sm font-medium mt-3 mb-1">{c.title}</p>
                  <p className="text-silver/50 text-xs leading-relaxed">{c.desc}</p>
                  {c.badge && <span className="inline-block mt-3 text-[10px] px-2 py-0.5 rounded-full bg-forest/15 text-forest">{c.badge}</span>}
                </div>
              ))}</div>
            </div>}
          </section>}

          {/* EPD DOCS */}
          {sd.epdDocs?.length > 0 && <section className="py-16 border-b border-silver/10">
            <h2 className="text-2xl font-light tracking-wider text-white text-center mb-12">{isZh ? "EPD 认证与文件" : "EPD Certifications & Documents"}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{sd.epdDocs.map((doc: any, i: number) => (
              <div key={i} className="bg-deep-blue/20 border border-silver/10 rounded-xl p-6 text-center hover:border-forest/30 transition-colors">
                <span className="text-3xl block mb-3">{doc.icon || "📄"}</span>
                <p className="text-white text-sm font-medium mb-2">{doc.title}</p>
                <p className="text-silver/50 text-xs leading-relaxed mb-4">{doc.desc}</p>
                {doc.url ? (
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-1.5 text-[10px] rounded-lg border border-forest/30 text-forest bg-forest/5 hover:bg-forest/20 transition-colors">
                    {isZh ? "下载 PDF" : "Download PDF"}
                  </a>
                ) : (
                  <span className="inline-block px-4 py-1.5 text-[10px] rounded-lg border border-silver/20 text-silver/40 bg-transparent cursor-not-allowed">
                    {isZh ? "即将上线" : "Coming Soon"}
                  </span>
                )}
              </div>
            ))}</div>
          </section>}

          {/* CTA */}
          <section className="py-16 text-center">
            <h2 className="text-2xl font-light tracking-wider text-white mb-4">{isZh ? "B2B 采购合作伙伴" : "B2B Procurement Partners"}</h2>
            <p className="text-silver/50 text-sm max-w-2xl mx-auto mb-8 leading-relaxed">
              {isZh ? "需要满足 Scope 3 脱碳目标？为高端住宅项目指定绿色家电？联系我们获取完整的 LCA 数据包和批发定价。" : "Looking to satisfy Scope 3 targets or specify green appliances for premium projects? Access our verified LCA data packs and wholesale pricing."}
            </p>
            <div className="max-w-xs mx-auto"><FloatingInquiry locale={locale} /></div>
          </section>

        </div>
      </main>
      <Footer />
    </>
  );
}
