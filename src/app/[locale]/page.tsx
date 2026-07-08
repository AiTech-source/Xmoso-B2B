import dynamic from "next/dynamic";
import { generateLocaleParams } from "@/lib/static-params";
export const generateStaticParams = generateLocaleParams;
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageBannerCarousel from "@/components/layout/PageBannerCarousel";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import HeroSection from "@/components/home/HeroSection";
import { createServerStaticClient } from "@/lib/supabase/server-static";
import { organizationSchema, renderJsonLd } from "@/lib/seo/json-ld";
import { ogImageUrl, getOgSettings } from "@/lib/seo/og";
import { generateAlternates } from "@/lib/seo/hreflang";
import type { Metadata } from "next";

// Below-fold components — lazy load to reduce initial JS
const HomeProducts = dynamic(() => import("@/components/home/HomeProducts"), { ssr: true });
const PageContentRenderer = dynamic(() => import("@/components/layout/PageContentRenderer"), { ssr: true });
const AnimateSection = dynamic(() => import("@/components/layout/AnimateSection"), { ssr: true });

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const supabase = await createServerStaticClient();
  const ogSet = await getOgSettings(supabase);
  const isZh = locale === "zh";
  const title = isZh ? "红酒柜制造商 — 定制酒柜 OEM/ODM 工厂 | Xmoso" : "Wine Cooler OEM Manufacturer China — Custom Wine Fridge Factory | Xmoso";
  let desc = isZh
    ? "Xmoso 是专业红酒柜、雪茄柜、饮料柜制造商。提供 OEM/ODM 定制服务，CE/UL/ETL 认证，25 年制冷经验。中国酒柜工厂直供。"
    : "Xmoso is a professional wine cooler OEM manufacturer in China. Custom wine fridge OEM/ODM, CE/UL/ETL certified, 25+ years of refrigeration expertise. Factory-direct wine cabinet supplier.";

  if (supabase) {
    const { data } = await supabase.from("page_contents")
      .select("seo_description").eq("page_key", "home").eq("locale", locale).maybeSingle();
    if (data?.seo_description) desc = data.seo_description;
  }

  return {
    title,
    description: desc,
    alternates: generateAlternates("/", locale),
    openGraph: {
      type: "website",
      title: `${ogSet.brand} — ${title}`,
      description: desc,
      images: [{ url: ogImageUrl({ title: "Wine Cooler OEM China", subtitle: "Custom Wine Fridge Factory", type: "page", brand: ogSet.brand }), width: 1200, height: 630 }],
    },
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createServerStaticClient();
  const isZh = locale === "zh";

  let showBanner = true;
  let vignetteEnabled = true;
  let sloganLine1 = isZh ? "红酒柜 OEM 制造商" : "Wine Cooler OEM Manufacturer China";
  let sloganLine2 = isZh ? "专业定制 · 工厂直供" : "Custom Wine Fridge Factory — Direct from China";
  let sloganSize = 30;
  let subtitleSize = 24;
  let aboutBlocks: any = null;
  let initialBanner: { id: string; image_url: string; alt_text?: string } | null = null;

  if (supabase) {
    const { data: pg } = await supabase.from("page_contents")
      .select("*").eq("page_key", "home").eq("locale", locale).maybeSingle();
    if (pg) {
      showBanner = pg.show_banner !== false;
      vignetteEnabled = pg.vignette_enabled !== false;
      if (pg.title) sloganLine1 = pg.title;
      if (pg.subtitle) sloganLine2 = pg.subtitle;
      sloganSize = pg.slogan_font_size || 30;
      subtitleSize = pg.subtitle_font_size || 24;
    }

    const { data: aboutPg } = await supabase.from("page_contents")
      .select("content, title").eq("page_key", "about").eq("locale", locale).maybeSingle();
    if (aboutPg) {
      aboutBlocks = aboutPg.content;
    }

    if (locale === "en") {
      const { data: banners } = await supabase
        .from("page_banners")
        .select("id, image_url, alt_text, orientation")
        .eq("page_key", "home")
        .order("sort_order", { ascending: true })
        .limit(1);
      if (banners?.length && banners[0].image_url) {
        initialBanner = banners[0];
      }
    }
  }

  return (
    <>
      <Header />
      <main style={{ paddingTop: "64px", minHeight: "80vh" }}>
        {showBanner && <PageBannerCarousel pageKey="home" vignette={vignetteEnabled} initialBanner={initialBanner} />}
        <Breadcrumbs items={[{ label: isZh ? "首页" : "Home" }]} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: renderJsonLd(organizationSchema("Xmoso", `https://xmoso.com${locale === "en" ? "" : `/${locale}`}`)) }} />
        <HeroSection line1={sloganLine1} line2={sloganLine2} line1Size={sloganSize} line2Size={subtitleSize} />

        {/* Product Preview with category tabs */}
        <HomeProducts locale={locale} />

        {/* About Us Preview */}
        {aboutBlocks && (
          <AnimateSection className="max-w-4xl mx-auto px-4 py-16">
            <PageContentRenderer content={aboutBlocks} />
            <div className="text-center mt-10">
              <Link href={`/${locale}/about#about-content`}
                className="inline-block px-8 py-3 border border-forest/40 text-forest rounded-full text-sm tracking-wider hover:bg-forest/10 transition-all">
                {isZh ? "了解更多 →" : "Learn More About Us →"}
              </Link>
            </div>
          </AnimateSection>
        )}

        {/* Why Xmoso for OEM/ODM — SEO-optimized content section */}
        <section className="border-t border-silver/10">
          <div className="max-w-4xl mx-auto px-4 py-16">
            <h2 className="text-2xl md:text-3xl font-light tracking-wider text-white text-center mb-12">
              {isZh ? "为什么选择 Xmoso 作为您的酒柜 OEM 合作伙伴" : "Why Choose Xmoso as Your Wine Cooler OEM Partner"}
            </h2>

            <div className="space-y-8 text-silver/70 text-[15px] leading-relaxed">
              {isZh ? (
                <>
                  <p>Xmoso 是中国领先的高端酒柜、雪茄柜、饮料柜 OEM/ODM 制造商，总部位于广东中山——中国南部家电制造核心区域。公司拥有超过 20,000 平方米的现代化生产基地，年产能超过 30 万台，服务全球超过 50 个国家和地区的品牌客户。</p>

                  <p>我们的研发团队由 30 余名工程师组成，涵盖制冷系统、结构设计、电气控制和 CFD 风道仿真等专业领域。每款产品在量产前均经过严格的 EN 60335-2-24 安全测试和 ISO 23953 性能测试，确保符合 CE、UL、ETL、RoHS 等国际认证标准。</p>

                  <p>作为一家技术驱动型制造商，Xmoso 在以下领域拥有核心竞争力：变频压缩机控制技术（实现 ±0.3°C 温控精度）、生物基材料应用（毛竹复合材料减少碳足迹）、CFD 优化风道设计（温度均匀性提升 40%）以及智能物联网温控平台。这些技术积累使我们能够为全球品牌客户提供差异化的产品解决方案。</p>

                  <p>我们提供完整的 OEM/ODM 服务流程：需求分析 → 概念设计 → 3D 建模与结构仿真 → 手板打样 → 认证测试 → 批量生产 → 质量检验 → 全球物流。最小起订量灵活，标准产品 100 台起订，定制产品 500 台起订。交货期通常为 30-45 天，视产品复杂度而定。</p>

                  <p>Xmoso 已与多家欧洲、北美和澳洲知名品牌建立长期合作关系。我们理解 B2B 客户最关心的三个核心指标：产品质量一致性、交货准时率和售后响应速度——在这三个方面我们均保持行业领先水平。</p>
                </>
              ) : (
                <>
                  <p>Xmoso is a leading OEM/ODM manufacturer of premium wine coolers, cigar humidors, and beverage cabinets, headquartered in Zhongshan, Guangdong — the heart of China&apos;s home appliance manufacturing hub. Our factory spans 20,000+ square meters with an annual production capacity exceeding 300,000 units, serving branded clients across 50+ countries worldwide.</p>

                  <p>Our R&D team comprises 30+ engineers specializing in refrigeration systems, structural design, electrical controls, and CFD airflow simulation. Every product undergoes rigorous EN 60335-2-24 safety testing and ISO 23953 performance validation before mass production, ensuring compliance with CE, UL, ETL, RoHS, and other international certification standards.</p>

                  <p>As a technology-driven manufacturer, Xmoso maintains core competencies in variable-speed compressor control (achieving ±0.3°C temperature stability), bio-based material application (Moso bamboo composites for reduced carbon footprint), CFD-optimized airflow design (40% improvement in temperature uniformity), and IoT-enabled smart temperature monitoring platforms. These technological differentiators enable us to deliver unique product solutions for global brand partners.</p>

                  <p>Our full OEM/ODM service workflow covers: requirements analysis → concept design → 3D modeling and structural simulation → prototype development → certification testing → mass production → quality inspection → global logistics. Minimum order quantities are flexible: 100 units for standard products and 500 units for customized designs. Typical lead time is 30-45 days depending on product complexity.</p>

                  <p>Xmoso has established long-term partnerships with recognized brands across Europe, North America, and Australia. We understand that B2B clients prioritize three core metrics: product quality consistency, on-time delivery rate, and after-sales response speed — and we maintain industry-leading performance across all three dimensions.</p>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Factory Capabilities — additional SEO content */}
        <section className="border-t border-silver/10 bg-deep-blue/5">
          <div className="max-w-4xl mx-auto px-4 py-16">
            <h2 className="text-2xl md:text-3xl font-light tracking-wider text-white text-center mb-12">
              {isZh ? "制造能力与认证" : "Manufacturing Capabilities & Certifications"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { title: isZh ? "🏭 生产基地" : "🏭 Production Base", content: isZh ? "20,000㎡ 现代化工厂，年产能 30 万台，8 条自动化生产线，支持 OEM/ODM 定制生产。" : "20,000㎡ modern facility, 300K unit annual capacity, 8 automated production lines supporting OEM/ODM manufacturing." },
                { title: isZh ? "🔬 研发测试" : "🔬 R&D & Testing", content: isZh ? "30+ 工程师团队，20 个内部实验室，涵盖性能测试、可靠性测试、EMC 测试和能效标定。" : "30+ engineers, 20 in-house labs covering performance testing, reliability validation, EMC compliance, and energy efficiency calibration." },
                { title: isZh ? "✅ 质量认证" : "✅ Quality Certifications", content: isZh ? "ISO 9001:2015 质量管理体系，CE/UL/ETL/RoHS/REACH 产品认证，100% 出厂检验。" : "ISO 9001:2015 certified QMS, CE/UL/ETL/RoHS/REACH product certifications, 100% factory inspection before shipment." },
                { title: isZh ? "🌍 全球物流" : "🌍 Global Logistics", content: isZh ? "与多家国际货运代理合作，提供 FOB/CIF/DDP 贸易条款，海运至欧洲 25 天、北美 20 天。" : "Partnership with major freight forwarders, FOB/CIF/DDP trade terms available. Sea freight: 25 days to Europe, 20 days to North America." },
                { title: isZh ? "📦 灵活 MOQ" : "📦 Flexible MOQ", content: isZh ? "标准产品 100 台起订，定制产品 500 台起订。支持混装订单和分批交货。" : "100 units for standard products, 500 for custom designs. Mixed pallet orders and split shipments supported." },
                { title: isZh ? "🛠️ 售后服务" : "🛠️ After-Sales Support", content: isZh ? "12 个月质量保证，48 小时技术响应，全球备件供应体系，提供 OEM 品牌专属售后方案。" : "12-month warranty, 48-hour technical response, global spare parts supply, dedicated after-sales programs for OEM brands." },
              ].map((item, i) => (
                <div key={i} className="bg-deep-blue/20 border border-silver/10 rounded-xl p-6 hover:border-forest/30 transition-colors">
                  <h3 className="text-white text-sm font-medium mb-3">{item.title}</h3>
                  <p className="text-silver/60 text-sm leading-relaxed">{item.content}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link href={`/${locale}/sourcing`}
                className="inline-block px-10 py-4 bg-forest/80 text-white rounded-full text-sm tracking-wider hover:bg-forest transition-all">
                {isZh ? "了解更多制造能力 →" : "Learn More About Our Manufacturing →"}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
