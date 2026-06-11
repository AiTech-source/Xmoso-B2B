import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import FaqAccordion from "@/components/faq/FaqAccordion";
import { faqPageSchema, renderJsonLd } from "@/lib/seo/json-ld";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ogImageUrl, getOgSettings } from "@/lib/seo/og";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const supabase = await createServerSupabaseClient();
  const ogSet = await getOgSettings(supabase);
  const title = locale === "zh" ? "常见问题" : "FAQ";
  return {
    title,
    alternates: { canonical: `/${locale}/faq` },
    openGraph: {
      type: "website",
      title: `${ogSet.brand} — ${title}`,
      images: [{ url: ogImageUrl({ title, type: "faq", brand: ogSet.brand }), width: 1200, height: 630 }],
    },
  };
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createServerSupabaseClient();

  let items: any[] = [];
  if (supabase) {
    const { data } = await supabase.from("faq_items").select("*").eq("locale", locale).order("sort_order");
    items = data || [];
  }

  const categories = [...new Set(items.map((i) => i.category))];

  // FAQPage Schema for AI engines
  const schema = faqPageSchema(items.map((i) => ({ question: i.question, answer: i.answer })));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: renderJsonLd(schema) }} />
      <Header />
      <main style={{ paddingTop: "64px" }}>
        <Breadcrumbs items={[{ label: "FAQ" }]} />
        <div className="max-w-3xl mx-auto px-4 py-16">
          <h1 className="text-3xl md:text-4xl font-light tracking-wider text-white mb-4">
            {locale === "zh" ? "常见问题" : "Frequently Asked Questions"}
          </h1>
          <p className="text-silver/60 mb-12">
            {locale === "zh" ? "关于产品、安装、质保的常见问题" : "Common questions about our products, installation, and warranty."}
          </p>

          {categories.map((cat) => (
            <div key={cat} className="mb-10">
              <h2 className="text-sm text-forest uppercase tracking-wider mb-4">{cat}</h2>
              <FaqAccordion items={items.filter((i) => i.category === cat)} />
            </div>
          ))}

          {items.length === 0 && (
            <div className="text-center py-16 text-silver/40 text-sm">
              {locale === "zh" ? "暂无常见问题" : "No FAQs yet. Check back soon."}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
