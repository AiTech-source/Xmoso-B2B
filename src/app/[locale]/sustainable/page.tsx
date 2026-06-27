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
          <section className="py-16 border-b border-silver/10 bg-gradient-to-r from-deep-blue/40 to-transparent">
            <div className="max-w-4xl mx-auto text-center">
              <div className="bg-deep-dark/60 border border-forest/20 rounded-2xl p-8 md:p-12">
                <span className="text-5xl block mb-4">🏭</span>
                <p className="text-xl md:text-2xl font-light text-white leading-relaxed" dangerouslySetInnerHTML={{
                  __html: isZh
                    ? "型号 145DB：在出厂前即安全抵消了 <span class='text-forest font-medium'>60.6 kg</span> 的二氧化碳当量。"
                    : "Model 145DB: Safely Offsets <span class='text-forest font-medium'>60.6 kg</span> of CO₂e Before Leaving the Factory Gate."
                }} />
                <p className="text-silver/50 text-sm mt-4">{isZh ? "材料固碳 + 清洁生产 = 出厂即负碳" : "Material sequestration + clean manufacturing = carbon-negative from day one"}</p>
              </div>
            </div>
          </section>

          {/* METRICS */}
          <section className="py-16 border-b border-silver/10">
            <h2 className="text-2xl font-light tracking-wider text-forest text-center mb-12">{isZh ? "核心环保指标" : "Environmental Impact Metrics"}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { value: "-48.3", unit: "kg CO₂e", label: isZh ? "每台碳抵消" : "Carbon Offset per Unit", sub: isZh ? "145DB 全生命周期" : "145DB Lifecycle Verified" },
                { value: "91.56", unit: "kg CO₂", label: isZh ? "生物固碳量" : "Biogenic CO₂ Captured", sub: isZh ? "毛竹生长期间吸收" : "Locked in Moso bio-materials" },
                { value: "80%", unit: "plastic-free", label: isZh ? "结构件替代率" : "Structural Plastic Replaced", sub: isZh ? "生物基材替代结构塑料" : "Bio-materials replace structural plastic" },
                { value: "36", unit: "dB(A)", label: isZh ? "超静音运行" : "Ultra-Quiet Operation", sub: isZh ? "VDE ErP 认证" : "VDE ErP Certified" },
              ].map((item, i) => (
                <div key={i} className="bg-deep-blue/20 border border-silver/10 rounded-xl p-6 text-center hover:border-forest/30 transition-colors">
                  <p className="text-3xl md:text-4xl font-light text-forest">{item.value}</p>
                  <p className="text-xs text-forest/60 tracking-wider uppercase mt-1">{item.unit}</p>
                  <p className="text-white text-sm font-medium mt-4">{item.label}</p>
                  <p className="text-silver/50 text-xs mt-1">{item.sub}</p>
                </div>
              ))}
            </div>
          </section>

          {/* STORY — Forest equivalent + project scale */}
          <section className="py-16 border-b border-silver/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
              <div>
                <h2 className="text-2xl font-light tracking-wider text-white mb-6">{isZh ? "森林等效故事" : "Forest Equivalent Story"}</h2>
                <div className="bg-deep-blue/20 border border-silver/10 rounded-xl p-6 mb-6">
                  <span className="text-3xl block mb-3">🌳</span>
                  <p className="text-white text-sm font-medium mb-2">{isZh ? "每台 145DB 酒柜" : "Each 145DB Wine Cooler"}</p>
                  <p className="text-silver/60 text-sm leading-relaxed" dangerouslySetInnerHTML={{
                    __html: isZh
                      ? "其材料储存的 91.56 kg 生物碳（Biogenic CO₂），相当于为地球锁定了近 <strong class='text-forest'>4.5 棵</strong> 成熟树木一整年吸收的碳量。"
                      : "The 91.56 kg of biogenic CO₂ stored in its materials equals the annual carbon capture of nearly <strong class='text-forest'>4.5</strong> mature trees."
                  }} />
                </div>
                <div className="bg-deep-blue/20 border border-forest/20 rounded-xl p-6">
                  <span className="text-3xl block mb-3">🏗️</span>
                  <p className="text-white text-sm font-medium mb-2">{isZh ? "大型项目减碳奇迹" : "Large Project Carbon Impact"}</p>
                  <p className="text-silver/60 text-sm leading-relaxed" dangerouslySetInnerHTML={{
                    __html: isZh
                      ? "如果北欧某个高档公寓或连锁酒店项目采购 <strong class='text-forest'>200 台</strong> 145DB 型号，将直接为该项目的 Scope 3 采购指标净减碳 <strong class='text-forest'>12.1 吨</strong>（12,124 kg CO₂e）！"
                      : "A 200-unit order of 145DB for a Nordic apartment or hotel project directly reduces Scope 3 procurement emissions by <strong class='text-forest'>12.1 tonnes</strong> (12,124 kg CO₂e)!"
                  }} />
                </div>
              </div>
              <div className="bg-deep-blue/20 border border-silver/10 rounded-xl p-8 text-center md:mt-0 mt-6">
                <span className="text-7xl block mb-4">🎋</span>
                <p className="text-forest text-lg font-light tracking-wide">{isZh ? "负碳材料" : "Carbon-Negative Material"}</p>
                <p className="text-silver/50 text-xs mt-2">{isZh ? "EN 16485 认证可再生生物基材" : "EN 16485 Certified Renewable Bio-Material"}</p>
                <div className="mt-6 pt-6 border-t border-silver/10">
                  <p className="text-xs text-silver/50">{isZh ? "毛竹生长过程中吸收大气 CO₂" : "Moso bamboo absorbs atmospheric CO₂ during growth"}</p>
                  <p className="text-xs text-silver/50 mt-1">{isZh ? "永久锁在材料中，即使产品废弃也不会释放" : "Permanently locked in material — never re-enters the atmosphere"}</p>
                </div>
              </div>
            </div>
          </section>

          {/* PRODUCT DATA */}
          <section className="py-16 border-b border-silver/10">
            <h2 className="text-2xl font-light tracking-wider text-white text-center mb-12">{isZh ? "产品环保数据" : "Product Sustainability Data"}</h2>
            <div className="bg-deep-blue/20 border border-forest/20 rounded-xl p-6 md:p-8 mb-6">
              <h3 className="text-lg text-forest font-medium tracking-wide mb-6">XFS145DB — {isZh ? "独立式红酒柜" : "Freestanding Wine Cooler"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: "🪵", title: isZh ? "负碳资产" : "Carbon-Negative Asset", desc: isZh ? "0.0551 m³ HD 毛竹生物基材，替代80%结构塑料。永久封存 91.56 kg 生物源 CO₂。" : "0.0551 m³ HD Moso bio-materials replace 80% of structural plastics. Permanently locks 91.56 kg biogenic CO₂.", badge: "-48.30 kg CO₂e" },
                  { icon: "📏", title: isZh ? "尺寸与结构" : "Dimensions & Build", desc: isZh ? "W592×D568×H715mm。混合材料厚度（5mm/8mm）优化热密封性能和结构完整性。" : "W592×D568×H715mm. Hybrid material thickness (5mm/8mm) for thermal sealing and structural integrity.", badge: isZh ? "嵌入式/独立式" : "Built-In / Freestanding" },
                  { icon: "🔊", title: isZh ? "超静音" : "Acoustic Comfort", desc: isZh ? "VDE ErP 能效认证。先进压缩机减震技术，36 dB 超静音运行。" : "VDE ErP certified. Advanced compressor dampening delivers whisper-quiet 36 dB operation.", badge: "36 dB(A) VDE ErP" },
                ].map((item, i) => (
                  <div key={i} className="bg-deep-dark/40 border border-silver/10 rounded-lg p-5">
                    <span className="text-2xl">{item.icon}</span>
                    <p className="text-white text-sm font-medium mt-3 mb-1">{item.title}</p>
                    <p className="text-silver/50 text-xs leading-relaxed">{item.desc}</p>
                    <span className="inline-block mt-3 text-[10px] px-2 py-0.5 rounded-full bg-forest/15 text-forest">{item.badge}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-deep-blue/20 border border-silver/10 rounded-xl p-6 md:p-8">
              <h3 className="text-lg text-forest font-medium tracking-wide mb-6">XBC90DB — {isZh ? "恒温餐边柜" : "Bar Cabinet Cooler"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: "🌱", title: isZh ? "生态美学" : "Eco-Aesthetics", desc: isZh ? "3.13 m² 负碳生物内衬，零有毒释放。植物生长过程吸收 25.93 kg 大气 CO₂。" : "3.13 m² negative-carbon bio-linings, zero toxic outgassing. Captures 25.93 kg atmospheric CO₂.", badge: "-12.25 kg CO₂e" },
                  { icon: "📏", title: isZh ? "尺寸与风格" : "Dimensions & Style", desc: isZh ? "W450×D515×H1395mm。生物基材外饰面提供实木橡木般的温润触感和设计灵活性。" : "W450×D515×H1395mm. Bio-material exterior delivers the warm tactile feel of solid oak.", badge: isZh ? "修长垂直设计" : "Slim Vertical Design" },
                  { icon: "🔊", title: isZh ? "纯净性能" : "Pure Performance", desc: isZh ? "36 dB 超静音运行，VDE 认证。食品安全级、无化学释放的储酒环境。" : "36 dB quiet runtime, VDE tested. Food-contact safe, chemical-free cellaring.", badge: "VDE ErP & CE" },
                ].map((item, i) => (
                  <div key={i} className="bg-deep-dark/40 border border-silver/10 rounded-lg p-5">
                    <span className="text-2xl">{item.icon}</span>
                    <p className="text-white text-sm font-medium mt-3 mb-1">{item.title}</p>
                    <p className="text-silver/50 text-xs leading-relaxed">{item.desc}</p>
                    <span className="inline-block mt-3 text-[10px] px-2 py-0.5 rounded-full bg-forest/15 text-forest">{item.badge}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* EPD */}
          <section className="py-16 border-b border-silver/10">
            <h2 className="text-2xl font-light tracking-wider text-white text-center mb-12">{isZh ? "EPD 认证与文件" : "EPD Certifications & Documents"}</h2>
            {pageData?.content?.blocks?.length > 0 && (
              <AnimateSection className="mb-8" id="sustainable-editable">
                <PageContentRenderer content={pageData.content} />
              </AnimateSection>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: "📄", title: isZh ? "EPD 145DB" : "EPD — 145DB", desc: isZh ? "全生命周期评估报告，包含碳足迹、能耗、材料组成等数据。" : "Full LCA report including carbon footprint, energy consumption, material composition." },
                { icon: "📄", title: isZh ? "EPD 90DB" : "EPD — 90DB", desc: isZh ? "餐边柜碳足迹数据，涵盖原材料获取到废弃处理全流程。" : "Bar cabinet carbon data, cradle-to-grave lifecycle assessment." },
                { icon: "📋", title: isZh ? "EN 15804 合规" : "EN 15804 Compliance", desc: isZh ? "建筑产品环境声明标准合规证书。" : "Construction products environmental declaration compliance." },
              ].map((item, i) => (
                <div key={i} className="bg-deep-blue/20 border border-silver/10 rounded-xl p-6 text-center hover:border-forest/30 transition-colors">
                  <span className="text-3xl block mb-3">{item.icon}</span>
                  <p className="text-white text-sm font-medium mb-2">{item.title}</p>
                  <p className="text-silver/50 text-xs leading-relaxed mb-4">{item.desc}</p>
                  <span className="inline-block px-4 py-1.5 text-[10px] rounded-lg border border-forest/30 text-forest bg-forest/5 cursor-not-allowed opacity-50">{isZh ? "即将上线" : "Coming Soon"}</span>
                </div>
              ))}
            </div>
          </section>

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
