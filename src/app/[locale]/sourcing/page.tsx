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
  let title = locale === "zh" ? "红酒柜、雪茄柜、饮料柜制造商 | 厂家直供 OEM/ODM" : "Wine Cooler Manufacturer & OEM Supplier | XMOSO Factory Direct";
  let desc = locale === "zh" ? "XMOSO 是专业红酒柜、雪茄柜、饮料柜、吧台柜制造商。CE/UL/ETL认证，OEM/ODM定制。" : "XMOSO is a professional manufacturer of wine coolers, cigar cabinets, beverage coolers & bar cabinets. CE/UL/ETL certified, OEM/ODM available.";

  if (supabase) {
    const { data } = await supabase.from("page_contents")
      .select("seo_title, seo_description").eq("page_key", "sourcing").eq("locale", locale).maybeSingle();
    if (data?.seo_title) title = data.seo_title;
    if (data?.seo_description) desc = data.seo_description;
  }

  const ogUrl = ogImageUrl({ title, type: "page", brand: ogSettings.brand });
  return {
    title, description: desc,
    alternates: { canonical: locale === "en" ? "/sourcing" : `/${locale}/sourcing` },
    openGraph: { type: "website", title, description: desc, images: [{ url: ogUrl }] },
  };
}

export default async function SourcingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createServerSupabaseClient();
  const ogSettings = await getOgSettings(supabase);
  const isZh = locale === "zh";

  // Fetch page content from DB (editable via admin)
  let pageData: any = null;
  if (supabase) {
    const { data } = await supabase.from("page_contents").select("*")
      .eq("page_key", "sourcing").eq("locale", locale).maybeSingle();
    pageData = data;
  }

  // Fetch FAQs
  const { data: genericFaqs } = await supabase
    .from("product_faqs").select("*").eq("product_type", "").eq("locale", "en").order("sort_order", { ascending: true });
  const { data: zhFaqs } = await supabase
    .from("product_faqs").select("*").eq("product_type", "").eq("locale", "zh").order("sort_order", { ascending: true });
  const faqData = isZh && zhFaqs?.length ? zhFaqs : genericFaqs;

  return (
    <>
      <Header />
      <main style={{ paddingTop: "64px" }}>
        <PageBannerCarousel pageKey="about" vignette />

        <Breadcrumbs items={[{ label: isZh ? "采购" : "Sourcing", href: `/${locale}/sourcing` }]} />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: renderJsonLd(organizationSchema("XMOSO", "https://xmoso.com")) }} />
        {faqData?.length && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: renderJsonLd(faqPageSchema(faqData.map((f: any) => ({ question: f.question, answer: f.answer })))) }} />
        )}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: renderJsonLd(breadcrumbListSchema([{ name: isZh ? "采购" : "Sourcing", url: `https://xmoso.com${isZh ? "/zh" : ""}/sourcing` }])) }} />

        <div className="max-w-7xl mx-auto px-4">

          {/* ====== HERO ====== */}
          <section className="py-16 md:py-24 text-center border-b border-silver/10">
            <h1 className="text-3xl md:text-5xl font-light tracking-wider text-white leading-tight">
              {pageData?.title || (isZh ? "专业酒柜、雪茄柜、饮料柜制造商" : "Premium Wine Cooler & Bar Cabinet Manufacturer")}
            </h1>
            <p className="text-silver/50 text-sm md:text-base mt-4 max-w-2xl mx-auto leading-relaxed">
              {pageData?.subtitle || (isZh
                ? "XMOSO 是一家专业的高端酒柜、雪茄柜、饮料柜和吧台柜制造商。我们为全球酒店、餐厅、零售商和品牌商提供 OEM/ODM 服务。"
                : "XMOSO is a professional manufacturer of high-end wine coolers, cigar cabinets, beverage coolers, and bar cabinets. We serve hotels, restaurants, retailers, and brands worldwide with OEM/ODM solutions.")}
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {["CE", "RoHS", "ERP", "ETL/UL", "ISO9001"].map((cert) => (
                <span key={cert} className="px-4 py-1.5 text-xs rounded-full border border-forest/30 text-forest bg-forest/5">{cert}</span>
              ))}
            </div>
          </section>

          {/* ====== EDITABLE CONTENT (added via admin /pages?key=sourcing) ====== */}
          {pageData?.content?.blocks?.length > 0 && (
            <AnimateSection className="py-16 border-b border-silver/10" id="sourcing-editable">
              <PageContentRenderer content={pageData.content} />
            </AnimateSection>
          )}

          {/* ====== CAPABILITIES ====== */}
          <section className="py-16 border-b border-silver/10">
            <h2 className="text-2xl font-light tracking-wider text-white text-center mb-12">
              {isZh ? "制造能力" : "Manufacturing Capabilities"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: "🏭", title: isZh ? "工厂实力" : "Factory Strength", desc: isZh ? "现代化生产基地，年产量超10万台，支持大规模订单和快速交付。" : "Modern production base with 100,000+ units annual capacity. Large-scale orders with fast turnaround." },
                { icon: "🔧", title: isZh ? "OEM/ODM 定制" : "OEM/ODM Customization", desc: isZh ? "Logo 印刷、颜色匹配（RAL/Pantone）、包装设计、温区配置、多语言标签全方位定制。" : "Full customization: logo, RAL/Pantone colors, packaging design, temperature zone config, multilingual labels." },
                { icon: "✅", title: isZh ? "质量认证" : "Quality Certifications", desc: isZh ? "CE, RoHS, ERP（欧洲市场）、ETL/UL（北美市场），ISO9001 质量体系。" : "CE, RoHS, ERP for EU; ETL/UL for North America; ISO9001 quality management." },
                { icon: "📦", title: isZh ? "灵活起订量" : "Flexible MOQ", desc: isZh ? "标准 OEM 50-100台起订。可提供 1-5 台样品订单，确认质量后再批量下单。" : "Standard MOQ 50-100 units. Sample orders of 1-5 units available for quality evaluation." },
                { icon: "🌍", title: isZh ? "全球出口" : "Global Export", desc: isZh ? "出口至北美、欧洲、澳大利亚、中东、东南亚。交期 15-40 天（取决于目的地）。" : "Exporting to North America, Europe, Australia, Middle East, SE Asia. Lead time 15-40 days." },
                { icon: "🛡️", title: isZh ? "售后服务" : "After-Sales Support", desc: isZh ? "1-2 年质保，大批量订单可延长质保期。提供技术支持和配件供应。" : "1-2 year warranty, extendable for bulk orders. Technical support and spare parts available." },
              ].map((item, i) => (
                <div key={i} className="bg-deep-blue/20 border border-silver/10 rounded-xl p-6 text-center hover:border-forest/30 transition-colors">
                  <span className="text-3xl">{item.icon}</span>
                  <h3 className="text-white text-sm font-medium mt-4 mb-2">{item.title}</h3>
                  <p className="text-silver/50 text-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ====== PRODUCT LINES ====== */}
          <section className="py-16 border-b border-silver/10">
            <h2 className="text-2xl font-light tracking-wider text-white text-center mb-12">
              {isZh ? "产品线" : "Product Lines"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "🍷 " + (isZh ? "红酒柜" : "Wine Coolers"), items: [isZh ? "压缩机制冷" : "Compressor cooling", isZh ? "单温区/双温区" : "Single/dual zone", isZh ? "6-320 瓶容量" : "6-320 bottle capacity", isZh ? "嵌入式/独立式" : "Built-in/Freestanding"] },
                { title: "🚬 " + (isZh ? "雪茄柜" : "Cigar Cabinets"), items: [isZh ? "西班牙雪松木内衬" : "Spanish cedar interior", isZh ? "恒温恒湿控制" : "Temp & humidity control", isZh ? "200-1000 支容量" : "200-1000 cigar capacity", isZh ? "热电冷系统" : "Thermoelectric cooling"] },
                { title: "🥤 " + (isZh ? "饮料柜" : "Beverage Coolers"), items: [isZh ? "台下式/独立式" : "Under-counter/Freestanding", isZh ? "玻璃门/实心门" : "Glass/Solid door", isZh ? "30-300 罐容量" : "30-300 can capacity", isZh ? "数字温控" : "Digital thermostat"] },
                { title: "🍸 " + (isZh ? "吧台柜" : "Bar Cabinets"), items: [isZh ? "酒店项目定制" : "Hotel project custom", isZh ? "多种材质饰面" : "Multiple materials", isZh ? "集成冷藏" : "Integrated refrigeration", isZh ? "LED 照明/门锁" : "LED lighting/locks"] },
              ].map((line, i) => (
                <div key={i} className="bg-deep-blue/20 border border-silver/10 rounded-xl p-6 hover:border-forest/30 transition-colors">
                  <h3 className="text-white text-base font-medium mb-4">{line.title}</h3>
                  <ul className="space-y-2">
                    {line.items.map((item, j) => (
                      <li key={j} className="text-silver/50 text-xs flex items-center gap-2">
                        <span className="text-forest">▸</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <a href={`/${locale}/products`}
                className="inline-block px-8 py-3 rounded-xl bg-forest/20 text-forest border border-forest/30 hover:bg-forest/30 transition-colors text-sm">
                {isZh ? "浏览全部产品 →" : "View All Products →"}
              </a>
            </div>
          </section>

          {/* ====== WHY CHOOSE XMOSO ====== */}
          <section className="py-16 border-b border-silver/10">
            <h2 className="text-2xl font-light tracking-wider text-white text-center mb-4">
              {isZh ? "合作优势" : "Why Choose XMOSO?"}
            </h2>
            <p className="text-silver/50 text-sm text-center max-w-xl mx-auto mb-10">
              {isZh ? "以品质、创新和可靠服务赢得全球客户的信任。" : "Trusted by global clients for quality, innovation, and reliable service."}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {[
                { q: isZh ? "品质保障" : "Quality Assured", a: isZh ? "每批次出货前经过严格质量检测，支持第三方验货（SGS/Bureau Veritas）。" : "Rigorous quality inspection before each shipment. Third-party inspection (SGS/Bureau Veritas) welcome." },
                { q: isZh ? "工厂直供" : "Factory Direct", a: isZh ? "去除中间环节，中国制造的成本优势直接传递给客户。同行无法匹敌的性价比。" : "Factory-direct pricing, eliminating middlemen. Unbeatable value from China manufacturing." },
                { q: isZh ? "交期保障" : "On-Time Delivery", a: isZh ? "标准化生产流程，95%+准时交付率，降低客户库存压力。" : "Standardized production, 95%+ on-time delivery rate. Reduced inventory risk for clients." },
                { q: isZh ? "灵活定制" : "Flexible Customization", a: isZh ? "从颜色、材质到功能配置全程定制支持。支持小批量试单，确认品质后再扩量。" : "Full customization from colors to functional specs. Trial orders accepted before scaling." },
              ].map((item, i) => (
                <div key={i} className="bg-deep-blue/20 border border-silver/10 rounded-xl p-6">
                  <h3 className="text-white text-sm font-medium mb-2">{item.q}</h3>
                  <p className="text-silver/50 text-xs leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ====== CONTACT / INQUIRY ====== */}
          <section className="py-16 text-center border-b border-silver/10">
            <h2 className="text-2xl font-light tracking-wider text-white mb-4">
              {isZh ? "开始合作" : "Start Your Sourcing Journey"}
            </h2>
            <p className="text-silver/50 text-sm max-w-xl mx-auto mb-8">
              {isZh
                ? "告诉我们您的需求，我们将在 24 小时内提供定制方案和报价。"
                : "Tell us your requirements and we'll provide a tailored solution and quote within 24 hours."}
            </p>
            <div className="max-w-xs mx-auto">
              <FloatingInquiry locale={locale} />
            </div>
          </section>

          {/* ====== FAQ ====== */}
          {faqData?.length > 0 && (
            <section className="py-16">
              <div className="p-8 bg-deep-blue/20 border border-silver/10 rounded-xl">
                <FaqAccordion faqs={faqData} title={isZh ? "❓ 常见采购问题" : "❓ Sourcing FAQ"} />
              </div>
            </section>
          )}

        </div>
      </main>
      <Footer />
    </>
  );
}
