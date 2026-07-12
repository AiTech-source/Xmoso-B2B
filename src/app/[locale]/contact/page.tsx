import Header from "@/components/layout/Header";
import { generateLocaleParams } from "@/lib/static-params";
export const generateStaticParams = generateLocaleParams;
import Footer from "@/components/layout/Footer";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import PageBannerCarousel from "@/components/layout/PageBannerCarousel";
import PageContentRenderer from "@/components/layout/PageContentRenderer";
import AnimateSection from "@/components/layout/AnimateSection";
import InquiryForm from "@/components/products/InquiryForm";
import { createServerStaticClient } from "@/lib/supabase/server-static";
import { cdnUrl } from "@/lib/cdn";
import { organizationSchema, renderJsonLd } from "@/lib/seo/json-ld";
import { ogImageUrl, getOgSettings } from "@/lib/seo/og";
import { generateAlternates } from "@/lib/seo/hreflang";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const supabase = await createServerStaticClient();
  const ogSet = await getOgSettings(supabase);
  const title = locale === "zh" ? "联系我们" : "Contact Us";
  const description = locale === "zh"
    ? "联系 Xmoso 获取恒温酒柜、嵌入式酒柜和餐边柜制冷项目的小批量样品、OEM/ODM 合作与报价。"
    : "Contact Xmoso for pilot orders, samples, OEM/ODM cooperation, and quotes for wine coolers, built-in cooling, and bar cabinet cooler projects.";
  return {
    title,
    description,
    alternates: generateAlternates("/contact", locale),
    openGraph: {
      type: "website",
      title: `${ogSet.brand} — ${title}`,
      description,
      images: [{ url: ogImageUrl({ title, type: "page", brand: ogSet.brand }), width: 1200, height: 630 }],
    },
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createServerStaticClient();

  let pageData: any = null;
  let initialBanner: any = null;
  if (supabase) {
    const [{ data }, { data: banner }] = await Promise.all([
      supabase.from("page_contents").select("*").eq("page_key", "contact").eq("locale", locale).maybeSingle(),
      supabase.from("page_banners").select("id, image_url, alt_text, orientation")
        .eq("page_key", "contact").order("sort_order", { ascending: true }).limit(1).maybeSingle(),
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
        {pageData?.show_banner !== false && <PageBannerCarousel pageKey="contact" vignette={pageData?.vignette_enabled !== false} initialBanner={initialBanner} />}
        <Breadcrumbs items={[{ label: "Contact Us" }]} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: renderJsonLd(organizationSchema("Xmoso", "https://xmoso.com")) }} />
        <AnimateSection className="px-4 py-16">
          <h1 className="text-3xl md:text-4xl font-light tracking-wider text-white mb-12 text-center">
            {pageData?.title || "Contact Us"}
          </h1>
          <PageContentRenderer content={pageData?.content || { blocks: [] }} />

          <div className="max-w-lg mx-auto mt-12">
            <InquiryForm locale={locale} />
          </div>

          {/* Contact Info — below inquiry form */}
          {pageData?.contact_info?.length > 0 && (
            <div className="max-w-2xl mx-auto mt-16 p-8 bg-deep-blue/30 border border-silver/10 rounded-xl">
              <h3 className="text-sm text-forest uppercase tracking-wider mb-6 text-center">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pageData.contact_info.filter((c: any) => c.value).map((item: any, i: number) => (
                  <div key={i} className={`flex items-start gap-3 ${item.label === "Address" ? "md:col-span-2" : ""}`}>
                    <span className="text-xl mt-0.5">{item.icon}</span>
                    <div>
                      <p className="text-xs text-silver/50 uppercase tracking-wider">{item.label}</p>
                      <p className="text-sm text-white mt-0.5">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </AnimateSection>
      </main>
      <Footer />
    </>
  );
}
