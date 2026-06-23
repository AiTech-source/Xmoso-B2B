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

          {/* ====== CAPABILITIES (editable via admin /pages) ====== */}
          <section className="py-16 border-b border-silver/10">
            <h2 className="text-2xl font-light tracking-wider text-white text-center mb-12">
              {isZh ? "制造能力" : "Manufacturing Capabilities"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {(pageData?.content?.capabilities?.length
                ? pageData.content.capabilities
                : [
                    { icon: "🏭", title: "Factory Strength", desc: "" },
                    { icon: "🔧", title: "OEM/ODM Customization", desc: "" },
                    { icon: "✅", title: "Quality Certifications", desc: "" },
                    { icon: "📦", title: "Flexible MOQ", desc: "" },
                    { icon: "🌍", title: "Global Export", desc: "" },
                    { icon: "🛡️", title: "After-Sales Support", desc: "" },
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
              <a href={`/${locale}/products`}
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
