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
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const supabase = await createServerStaticClient();
  let title = locale === "zh" ? "关于我们" : "About Us";
  let desc = locale === "zh" ? "了解DeepCool的品牌故事与使命。" : "Learn about DeepCool's story and mission.";

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
  let initialBanner: any = null;
  if (supabase) {
    const [{ data }, { data: banner }] = await Promise.all([
      supabase.from("page_contents").select("*").eq("page_key", "about").eq("locale", locale).maybeSingle(),
      supabase.from("page_banners").select("id, image_url, alt_text, orientation")
        .eq("page_key", "about").order("sort_order", { ascending: true }).limit(1).maybeSingle(),
    ]);
    pageData = data;
    if (banner?.image_url) initialBanner = banner;
  }

  return (
    <>
      {initialBanner?.image_url && (
        <link rel="preload" as="image" href={cdnUrl(initialBanner.image_url + "?w=1200&q=65")} fetchPriority="high" />
      )}
      <Header />
      <main style={{ paddingTop: "64px" }}>
        {pageData?.show_banner !== false && <PageBannerCarousel pageKey="about" vignette={pageData?.vignette_enabled !== false} initialBanner={initialBanner} />}
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
