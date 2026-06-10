import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import PageBannerCarousel from "@/components/layout/PageBannerCarousel";
import PageContentRenderer from "@/components/layout/PageContentRenderer";
import AnimateSection from "@/components/layout/AnimateSection";
import InquiryForm from "@/components/products/InquiryForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ogImageUrl, getOgSettings } from "@/lib/seo/og";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const supabase = await createServerSupabaseClient();
  const ogSet = await getOgSettings(supabase);
  const title = locale === "zh" ? "联系我们" : "Contact Us";
  return {
    title,
    openGraph: {
      title: `${ogSet.brand} — ${title}`,
      images: [{ url: ogImageUrl({ title, type: "page", brand: ogSet.brand, url: ogSet.siteUrl }), width: 1200, height: 630 }],
    },
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createServerSupabaseClient();

  let pageData: any = null;
  if (supabase) {
    const { data } = await supabase
      .from("page_contents")
      .select("*")
      .eq("page_key", "contact")
      .eq("locale", locale)
      .maybeSingle();
    pageData = data;
  }

  return (
    <>
      <Header />
      <main style={{ paddingTop: "64px" }}>
        {pageData?.show_banner !== false && <PageBannerCarousel pageKey="contact" vignette={pageData?.vignette_enabled !== false} />}
        <Breadcrumbs items={[{ label: "Contact Us" }]} />
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
