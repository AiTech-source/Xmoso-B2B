import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageBannerCarousel from "@/components/layout/PageBannerCarousel";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import HeroSection from "@/components/home/HeroSection";
import HomeProducts from "@/components/home/HomeProducts";
import PageContentRenderer from "@/components/layout/PageContentRenderer";
import AnimateSection from "@/components/layout/AnimateSection";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { organizationSchema, renderJsonLd } from "@/lib/seo/json-ld";
import { ogImageUrl, getOgSettings } from "@/lib/seo/og";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const supabase = await createServerSupabaseClient();
  const ogSet = await getOgSettings(supabase);
  const title = locale === "zh" ? "首页" : "Home";
  const desc = locale === "zh" ? "德国精工制造的葡萄酒恒温柜，精准温控。" : "German-engineered wine cooling cabinets with precision temperature control.";
  return {
    title,
    description: desc,
    openGraph: {
      title: `${ogSet.brand} — ${title}`,
      description: desc,
      images: [{ url: ogImageUrl({ title: "Less Appliances, Natural More", subtitle: "Precision Wine Cooling Cabinets", type: "page", brand: ogSet.brand }), width: 1200, height: 630 }],
    },
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createServerSupabaseClient();

  let showBanner = true;
  let vignetteEnabled = true;
  let sloganLine1 = "Less Appliances, Natural More";
  let sloganLine2 = locale === "zh" ? "更自然的家居化家电" : "Natural Living, Elevated";
  let sloganSize = 30;
  let subtitleSize = 24;
  let aboutBlocks: any = null;

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
  }

  return (
    <>
      <Header />
      <main style={{ paddingTop: "64px", minHeight: "80vh" }}>
        {showBanner && <PageBannerCarousel pageKey="home" vignette={vignetteEnabled} />}
        <Breadcrumbs items={[{ label: "Home" }]} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: renderJsonLd(organizationSchema("DeepCool", `https://deepcool.com/${locale}`)) }} />
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
                Learn More About Us →
              </Link>
            </div>
          </AnimateSection>
        )}
      </main>
      <Footer />
    </>
  );
}
