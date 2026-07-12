import Header from "@/components/layout/Header";
import { generateLocaleParams } from "@/lib/static-params";
export const generateStaticParams = generateLocaleParams;
import Footer from "@/components/layout/Footer";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import PageBannerCarousel from "@/components/layout/PageBannerCarousel";
import PageContentRenderer from "@/components/layout/PageContentRenderer";
import AnimateSection from "@/components/layout/AnimateSection";
import { createServerStaticClient } from "@/lib/supabase/server-static";
import { organizationSchema, renderJsonLd } from "@/lib/seo/json-ld";
import { ogImageUrl, getOgSettings } from "@/lib/seo/og";
import { generateAlternates } from "@/lib/seo/hreflang";
import { cdnUrl } from "@/lib/cdn";
import { getBannerPreloadMedia, getInitialPageBanners, getResponsiveBannerPreloads, type PageBannerData } from "@/lib/page-banners";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const supabase = await createServerStaticClient();
  let title = locale === "zh" ? "关于我们" : "About Us";
  let desc = locale === "zh"
    ? "了解 Xmoso 的产品理念、线下客户经验与差异化恒温酒柜、餐边柜制冷解决方案。"
    : "Learn about Xmoso's product-led approach to differentiated wine coolers, bar cabinet coolers, and small-batch B2B cooling projects.";

  if (supabase) {
    const { data } = await supabase.from("page_contents")
      .select("seo_title, seo_description").eq("page_key", "about").eq("locale", locale).maybeSingle();
    if (data?.seo_title) title = data.seo_title;
    if (data?.seo_description) desc = data.seo_description;
  }

  const ogSet = await getOgSettings(supabase);
  return {
    title,
    description: desc,
    alternates: generateAlternates("/about", locale),
    openGraph: {
      type: "website",
      title: `${ogSet.brand} — ${title}`,
      description: desc,
      images: [{ url: ogImageUrl({ title, type: "page", brand: ogSet.brand }), width: 1200, height: 630 }],
    },
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createServerStaticClient();

  let pageData: any = null;
  let initialBanners: PageBannerData[] = [];
  if (supabase) {
    const [{ data }, banners] = await Promise.all([
      supabase.from("page_contents").select("*").eq("page_key", "about").eq("locale", locale).maybeSingle(),
      getInitialPageBanners(supabase, "about"),
    ]);
    pageData = data;
    initialBanners = banners;
  }

  return (
    <>
      {getResponsiveBannerPreloads(initialBanners).map((banner) => (
        <link key={banner.id} rel="preload" as="image" href={cdnUrl(banner.image_url + "?w=1200&q=65")} fetchPriority="high" media={getBannerPreloadMedia(banner)} />
      ))}
      <Header />
      <main style={{ paddingTop: "64px" }}>
        {pageData?.show_banner !== false && <PageBannerCarousel pageKey="about" vignette={pageData?.vignette_enabled !== false} initialBanners={initialBanners} />}
        <Breadcrumbs items={[{ label: "About Us" }]} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: renderJsonLd(organizationSchema("Xmoso", `https://xmoso.com${locale === "en" ? "" : `/${locale}`}`)) }} />
        <AnimateSection className="px-4 py-16" id="about-content">
          <h1 className="text-3xl md:text-4xl font-light tracking-wider text-white mb-12 text-center">
            {pageData?.title || (locale === "zh" ? "关于我们" : locale === "fr" ? "À Propos" : locale === "de" ? "Über Uns" : locale === "no" ? "Om Oss" : locale === "fi" ? "Meistä" : locale === "sv" ? "Om Oss" : "About Us")}
          </h1>
          <PageContentRenderer content={pageData?.content || { blocks: [] }} />
        </AnimateSection>
      </main>
      <Footer />
    </>
  );
}
