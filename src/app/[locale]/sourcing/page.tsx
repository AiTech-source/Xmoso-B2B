import Header from "@/components/layout/Header";
import { generateLocaleParams } from "@/lib/static-params";
export const generateStaticParams = generateLocaleParams;
import Footer from "@/components/layout/Footer";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import PageBannerCarousel from "@/components/layout/PageBannerCarousel";
import PageContentRenderer from "@/components/layout/PageContentRenderer";
import AnimateSection from "@/components/layout/AnimateSection";
import FloatingInquiry from "@/components/products/FloatingInquiry";
import FaqAccordion from "@/components/products/FaqAccordion";
import { createServerStaticClient } from "@/lib/supabase/server-static";
import { cdnUrl } from "@/lib/cdn";
import { organizationSchema, faqPageSchema, breadcrumbListSchema, renderJsonLd } from "@/lib/seo/json-ld";
import { ogImageUrl, getOgSettings } from "@/lib/seo/og";
import { generateAlternates } from "@/lib/seo/hreflang";
import { localePath } from "@/lib/locale-path";
import { getBannerPreloadMedia, getInitialPageBanners, getResponsiveBannerPreloads, type PageBannerData } from "@/lib/page-banners";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const supabase = await createServerStaticClient();
  const ogSettings = await getOgSettings(supabase);
  let title = locale === "zh" ? "恒温酒柜小批量试单与 ODM 联合开发 | Xmoso" : "Pilot Orders & ODM Wine Cooler Development | Xmoso";
  let desc = locale === "zh" ? "Xmoso 支持嵌入式恒温酒柜、Moso Type 材料、餐边柜制冷一体化产品的小批量试单、样品评估和 OEM/ODM 合作。" : "Work with Xmoso on differentiated built-in wine coolers, Moso Type materials, and bar cabinet cooler pilot orders. Samples, small batches, OEM/ODM support.";

  if (supabase) {
    const { data } = await supabase.from("page_contents")
      .select("seo_title, seo_description").eq("page_key", "sourcing").eq("locale", locale).maybeSingle();
    if (data?.seo_title) title = data.seo_title;
    if (data?.seo_description) desc = data.seo_description;
  }

  const ogUrl = ogImageUrl({ title, type: "page", brand: ogSettings.brand });
  return {
    title, description: desc,
    alternates: generateAlternates("/sourcing", locale),
    openGraph: { type: "website", title, description: desc, images: [{ url: ogUrl }] },
  };
}

export default async function SourcingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createServerStaticClient();
  const ogSettings = await getOgSettings(supabase);
  const isZh = locale === "zh";

  // Fetch page content from DB (editable via admin)
  let pageData: any = null;
  let initialBanners: PageBannerData[] = [];
  if (supabase) {
    const [{ data }, banners] = await Promise.all([
      supabase.from("page_contents").select("*")
        .eq("page_key", "sourcing").eq("locale", locale).maybeSingle(),
      getInitialPageBanners(supabase, "sourcing"),
    ]);
    pageData = data;
    initialBanners = banners;
  }

  // Fetch FAQs
  const { data: genericFaqs } = await supabase
    .from("product_faqs").select("*").eq("product_type", "").eq("locale", "en").order("sort_order", { ascending: true });
  const { data: zhFaqs } = await supabase
    .from("product_faqs").select("*").eq("product_type", "").eq("locale", "zh").order("sort_order", { ascending: true });
  const faqData = isZh && zhFaqs?.length ? zhFaqs : genericFaqs;

  return (
    <>
      {getResponsiveBannerPreloads(initialBanners).map((banner) => (
        <link key={banner.id} rel="preload" as="image" href={cdnUrl(banner.image_url + "?w=1200&q=65")} fetchPriority="high" media={getBannerPreloadMedia(banner)} />
      ))}
      <Header />
      <main style={{ paddingTop: "64px" }}>
        <PageBannerCarousel pageKey="sourcing" vignette initialBanners={initialBanners} />

        <Breadcrumbs items={[{ label: isZh ? "采购" : "Sourcing", href: localePath(locale, "/sourcing") }]} />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: renderJsonLd(organizationSchema("XMOSO", "https://xmoso.com")) }} />
        {faqData?.length && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: renderJsonLd(faqPageSchema(faqData.map((f: any) => ({ question: f.question, answer: f.answer })))) }} />
        )}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: renderJsonLd(breadcrumbListSchema([{ name: isZh ? "采购" : "Sourcing", url: `https://xmoso.com${isZh ? "/zh" : ""}/sourcing` }])) }} />

        <div className="max-w-7xl mx-auto px-4">

          {/* ====== HERO ====== */}
          <section className="py-16 md:py-24 text-center border-b border-silver/10">
            <h1 className="text-3xl md:text-5xl font-light tracking-wider text-white leading-tight">
              {pageData?.title || (isZh ? "差异化恒温制冷产品的小批量试单与 ODM 联合开发" : "Pilot Orders & ODM Development for Differentiated Wine Cooling Products")}
            </h1>
            <p className="text-silver/50 text-sm md:text-base mt-4 max-w-2xl mx-auto leading-relaxed">
              {pageData?.subtitle || (isZh
                ? "Xmoso 面向品牌商、柜体厂和项目采购商，围绕嵌入式恒温酒柜、Moso Type 生物基材料、餐边柜制冷一体化概念，提供样品、小批量试单和务实工程支持。"
                : "Xmoso helps brands, cabinet makers, and project buyers validate built-in wine coolers, Moso Type materials, and integrated bar cabinet cooler concepts through samples, small-batch orders, and practical engineering support.")}
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

          {/* ====== CAPABILITIES (editable via admin /pages) ====== */}
          <section className="py-16 border-b border-silver/10">
            <h2 className="text-2xl font-light tracking-wider text-white text-center mb-12">
              {isZh ? "制造能力" : "Manufacturing Capabilities"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {(pageData?.content?.capabilities?.length
                ? pageData.content.capabilities
                : [
                    { icon: "🧭", title: isZh ? "产品驱动开发" : "Product-Led Development", desc: isZh ? "在大批量采购前，先帮助客户验证嵌入式酒柜、Moso Type 和餐边柜制冷概念的真实市场价值。" : "Early-stage product validation for built-in wine cooler, Moso Type, and bar cabinet cooler concepts before large purchasing commitments." },
                    { icon: "📦", title: isZh ? "样品与小批量试单" : "Samples & Pilot Batches", desc: isZh ? "支持 1-5 台样品评估和小批量试单，用于验证需求、安装适配和终端客户反馈。" : "Sample orders of 1-5 units and small pilot batches for buyers testing demand, installation fit, and customer response." },
                    { icon: "🧩", title: isZh ? "嵌入式融合细节" : "Integration Details", desc: isZh ? "围绕前端底部通风、左右换门、触摸开门、侧向固定、可做门板等细节降低项目风险。" : "Front-bottom ventilation, reversible doors, touch-open interaction, side fixing, and panel-ready options to reduce project risk." },
                    { icon: "🎋", title: isZh ? "材料与新品类故事" : "Material & Category Stories", desc: isZh ? "Moso Type 生物基材料和餐边柜制冷概念，帮助合作伙伴讲出不同于普通家电参数的产品故事。" : "Moso Type bio-based materials and bar cabinet cooler concepts help partners present products beyond standard appliance specifications." },
                    { icon: "✅", title: isZh ? "认证路径规划" : "Certification Planning", desc: isZh ? "CE/RoHS/ERP、ETL/UL 等目标市场要求可以在样品阶段提前讨论，让法规需求参与产品决策。" : "CE/RoHS/ERP and ETL/UL requirements can be discussed at the sample stage so market rules shape product decisions early." },
                    { icon: "🛠️", title: isZh ? "上市准备支持" : "Launch Support", desc: isZh ? "支持包装、标签、说明书、备件规划、FAQ 和买家可用的产品视觉证据。" : "Practical support for packaging, labels, manuals, spare parts planning, FAQs, and buyer-facing product evidence." },
                  ]
              ).map((item: any, i: number) => (
                <div key={i} className="bg-deep-blue/20 border border-silver/10 rounded-xl p-6 text-center hover:border-forest/30 transition-colors">
                  <span className="text-3xl">{item.icon}</span>
                  <h3 className="text-white text-sm font-medium mt-4 mb-2">{item.title}</h3>
                  <p className="text-silver/50 text-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ====== PRODUCT LINES (editable via admin /pages) ====== */}
          {(pageData?.content?.productLines?.length > 0) && (
          <section className="py-16 border-b border-silver/10">
            <h2 className="text-2xl font-light tracking-wider text-white text-center mb-12">
              {isZh ? "产品线" : "Product Lines"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {pageData.content.productLines.map((line: any, i: number) => {
                const icons = ["🍷", "🚬", "🥤", "🍸"];
                return (
                  <div key={i} className="bg-deep-blue/20 border border-silver/10 rounded-xl p-6 hover:border-forest/30 transition-colors">
                    <h3 className="text-white text-base font-medium mb-4">{icons[i] || "📦"} {line.title}</h3>
                    {(line.items || []).length > 0 && (
                      <ul className="space-y-2">
                        {line.items.map((item: string, j: number) => (
                          <li key={j} className="text-silver/50 text-xs flex items-center gap-2">
                            <span className="text-forest">▸</span>{item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="text-center mt-10">
              <a href={localePath(locale, "/products")}
                className="inline-block px-8 py-3 rounded-xl bg-forest/20 text-forest border border-forest/30 hover:bg-forest/30 transition-colors text-sm">
                {isZh ? "浏览全部产品 →" : "View All Products →"}
              </a>
            </div>
          </section>
          )}

          {/* ====== WHY CHOOSE XMOSO (editable via admin /pages) ====== */}
          {(pageData?.content?.whyChoose?.length > 0) && (
          <section className="py-16 border-b border-silver/10">
            <h2 className="text-2xl font-light tracking-wider text-white text-center mb-4">
              {isZh ? "合作优势" : "Why Choose XMOSO?"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {pageData.content.whyChoose.map((item: any, i: number) => (
                <div key={i} className="bg-deep-blue/20 border border-silver/10 rounded-xl p-6">
                  <h3 className="text-white text-sm font-medium mb-2">{item.q}</h3>
                  <p className="text-silver/50 text-xs leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
          )}

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
          <section className="py-16">
              <div className="p-8 bg-deep-blue/20 border border-silver/10 rounded-xl">
                <FaqAccordion locale={locale} title={isZh ? "❓ 常见采购问题" : "❓ Sourcing FAQ"} faqs={faqData} />
              </div>
            </section>

        </div>
      </main>
      <Footer />
    </>
  );
}
