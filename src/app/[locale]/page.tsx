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
import { cdnUrl } from "@/lib/cdn";
import { organizationSchema, renderJsonLd } from "@/lib/seo/json-ld";
import { ogImageUrl, getOgSettings } from "@/lib/seo/og";
import { generateAlternates } from "@/lib/seo/hreflang";
import { localePath } from "@/lib/locale-path";
import { getBannerPreloadMedia, getInitialPageBanners, getResponsiveBannerPreloads, type PageBannerData } from "@/lib/page-banners";
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
  const title = isZh ? "差异化恒温酒柜与餐边柜制冷方案 | Xmoso" : "Differentiated Wine Cooler & Bar Cabinet Cooler Development | Xmoso";
  let desc = isZh
    ? "Xmoso 面向品牌商、柜体厂、项目采购商开发差异化恒温酒柜、Moso Type 生物基材料和餐边柜制冷方案，支持样品、小批量试单和 ODM 联合开发。"
    : "Xmoso develops differentiated wine cooler and bar cabinet cooler concepts for brands, cabinet makers, and project buyers through samples, pilot orders, and ODM collaboration.";

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
  let sloganLine1 = isZh ? "差异化恒温制冷方案" : "Differentiated Cooling Concepts";
  let sloganLine2 = isZh ? "样品验证 · 小批量试单 · ODM 联合开发" : "Samples, Pilot Orders & ODM Development";
  let sloganSize = 30;
  let subtitleSize = 24;
  let aboutBlocks: any = null;
  let initialBanners: PageBannerData[] = [];
  let capabilitiesData: { title: string; content: string }[] = [];
  let whyChooseParagraphs: string[] = [];

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
      if (pg.content?.capabilities?.length) {
        capabilitiesData = pg.content.capabilities;
      }
      if (pg.content?.whyChooseParagraphs?.length) {
        whyChooseParagraphs = pg.content.whyChooseParagraphs;
      }
    }

    const { data: aboutPg } = await supabase.from("page_contents")
      .select("content, title").eq("page_key", "about").eq("locale", locale).maybeSingle();
    if (aboutPg) {
      aboutBlocks = aboutPg.content;
    }

    if (locale === "en") {
      initialBanners = await getInitialPageBanners(supabase, "home");
    }
  }

  return (
    <>
      {getResponsiveBannerPreloads(initialBanners).map((banner) => (
        <link key={banner.id} rel="preload" as="image" href={cdnUrl(banner.image_url + "?w=1200&q=65")} fetchPriority="high" media={getBannerPreloadMedia(banner)} />
      ))}
      <Header />
      <main style={{ paddingTop: "64px", minHeight: "80vh" }}>
        {showBanner && <PageBannerCarousel pageKey="home" vignette={vignetteEnabled} initialBanners={initialBanners} />}
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
              <Link href={`${localePath(locale, "/about")}#about-content`}
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
              {whyChooseParagraphs.length > 0 ? whyChooseParagraphs.map((text, i) => (
                <p key={i}>{text}</p>
              )) : (
                <>
                  <p>Xmoso is a product-led cooling solutions company founded in 2025, focused on differentiated wine coolers, Moso Type bio-based materials, and integrated bar cabinet cooler concepts for brands, cabinet makers, distributors, and project buyers.</p>
                  <p>Our current stage is best suited to sample evaluation, small-batch pilot orders, and ODM collaboration. Instead of asking buyers to commit to oversized launch quantities early, we help validate product-market fit, installation details, and customer experience first.</p>
                  <p>The product work is built on 10 years of offline customer feedback and category experience, including recurring issues around built-in ventilation, door-opening experience, bottle access, and cabinet integration.</p>
                  <p>Key advantages include patented front-bottom self-ventilation, compact no-top-box built-in appearance, touch-open glass door interaction, reversible door planning, and side fixing details that make installation more forgiving.</p>
                  <p>For commercial buyers, we position specifications as proof behind a clear product story: cleaner integration for cabinetry, easier buyer education, sample-ready development, and a practical path from pilot batch to repeat order.</p>
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
              {(capabilitiesData.length > 0 ? capabilitiesData : [
                { title: isZh ? "产品概念开发" : "Product Concept Development", content: isZh ? "支持 XBI/XBIU 嵌入式酒柜、Moso Type 材料故事、餐边柜制冷一体化等差异化概念开发。" : "Support for differentiated cooling concepts such as XBI/XBIU built-in wine coolers, Moso Type material stories, and integrated bar cabinet cooler formats." },
                { title: isZh ? "样品与小批量试单" : "Samples and Pilot Batches", content: isZh ? "依托真实研发试产场地和小批量生产线，适合样品评估、小批量试单和项目验证，帮助客户在扩大采购前先判断市场反馈。" : "Suitable for sample evaluation, small-batch trial orders, and project validation through a real pilot workshop and active trial-production line before larger purchasing commitments." },
                { title: isZh ? "嵌入式安装细节" : "Built-In Integration Details", content: isZh ? "重点关注前端底部通风、左右换门、触摸开门、侧向固定、可做门板等影响安装体验的细节。" : "Focus on front-bottom ventilation, reversible door planning, touch-open interaction, side fixing, and panel-ready installation details." },
                { title: isZh ? "材料差异化" : "Material Differentiation", content: isZh ? "Moso Type 生物基材料帮助品牌讲出更自然、更家居化的产品故事，而不只是普通金属家电外观。" : "Moso Type bio-based materials help brands tell a more natural, furniture-integrated product story beyond standard metal appliance styling." },
                { title: isZh ? "买家可用证据" : "Buyer-Facing Evidence", content: isZh ? "通过视觉细节、安装说明、FAQ 和规格证据，帮助经销商、柜体合作方和项目采购团队降低沟通成本。" : "Visual details, installation notes, FAQs, and specification proof can support distributors, cabinet partners, and project decision makers." },
                { title: isZh ? "务实 OEM/ODM 支持" : "Practical OEM/ODM Support", content: isZh ? "支持 Logo、表面、包装、标签、说明书和配置讨论，不强迫客户过早承担过大的首单数量。" : "Logo, finish, packaging, labels, manuals, and configuration discussions are available without forcing oversized launch quantities too early." },
              ]).map((item: any, i: number) => {
                const itemTitle = item.icon ? item.icon + " " + item.title : item.title;
                const itemContent = item.content || item.desc || "";
                return (
                  <div key={i} className="bg-deep-blue/20 border border-silver/10 rounded-xl p-6 hover:border-forest/30 transition-colors">
                    <h3 className="text-white text-sm font-medium mb-3">{itemTitle}</h3>
                    <p className="text-silver/60 text-sm leading-relaxed">{itemContent}</p>
                  </div>
                );})}
            </div>

            <div className="text-center mt-10">
              <Link href={localePath(locale, "/sourcing")}
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
