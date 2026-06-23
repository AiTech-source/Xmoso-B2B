import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import PageBannerCarousel from "@/components/layout/PageBannerCarousel";
import ImageGallery from "@/components/products/ImageGallery";
import SpecTable from "@/components/products/SpecTable";
import InstallationMedia from "@/components/products/InstallationMedia";
import RichContent from "@/components/products/RichContent";
import ParamCounter from "@/components/products/ParamCounter";
import SpecTabs from "@/components/products/SpecTabs";
import FloatingInquiry from "@/components/products/FloatingInquiry";
import ShareButton from "@/components/social/ShareButton";
import SpecSheetButton from "@/components/products/SpecSheetButton";
import FaqAccordion from "@/components/products/FaqAccordion";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { productSchema, breadcrumbListSchema, faqPageSchema, renderJsonLd } from "@/lib/seo/json-ld";
import { ogImageUrl, getOgSettings } from "@/lib/seo/og";
import type { Metadata } from "next";

async function getTranslation(supabase: any, locale: string, slug: string) {
  // Try requested locale first
  const { data: translation } = await supabase
    .from("product_translations").select("*, product:products(*)")
    .eq("locale", locale).eq("slug", slug).eq("product.is_active", true).single();

  if (translation) return { locale: locale as string, translation, product: translation.product };

  // Not found by slug+locale → find product_id via any locale's slug, then try again
  const { data: anyLocale } = await supabase
    .from("product_translations").select("product_id")
    .eq("slug", slug).maybeSingle();

  if (anyLocale) {
    // Try requested locale by product_id (handles different slugs per language)
    if (locale !== "en") {
      const { data: localeTrans } = await supabase
        .from("product_translations").select("*, product:products(*)")
        .eq("locale", locale).eq("product_id", anyLocale.product_id)
        .eq("product.is_active", true).maybeSingle();
      if (localeTrans) return { locale: locale as string, translation: localeTrans, product: localeTrans.product };
    }
    // Fallback to EN by product_id
    const { data: fallback } = await supabase
      .from("product_translations").select("*, product:products(*)")
      .eq("locale", "en").eq("product_id", anyLocale.product_id)
      .eq("product.is_active", true).single();
    if (fallback) return { locale: "en" as string, translation: fallback, product: fallback.product };
  }

  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const supabase = await createServerSupabaseClient();
  const result = await getTranslation(supabase, locale, slug);
  if (!result) return { title: "Product" };

  const { translation } = result;
  const product = translation.product;
  const ogSettings = await getOgSettings(supabase);
  const productImage = product?.image_gallery?.[0]?.url || product?.images?.[0] || "";
  const ogUrl = ogImageUrl({
    title: translation.meta_title || translation.name,
    subtitle: product?.model_number || "",
    type: "product",
    brand: ogSettings.brand,
    image: productImage || undefined,
  });

  return {
    title: translation.meta_title || translation.name,
    description: translation.meta_description || translation.description || undefined,
    alternates: { canonical: locale === "en" ? `/products/${slug}` : `/${locale}/products/${slug}` },
    openGraph: {
      type: "website",
      title: translation.meta_title || translation.name,
      description: translation.meta_description || translation.description || undefined,
      images: [{ url: productImage || ogUrl, width: 1200, height: 630 }],
    },
    other: {
      "twitter:card": "summary_large_image",
      "twitter:title": translation.meta_title || translation.name,
      "twitter:description": translation.meta_description || translation.description || undefined,
      "twitter:image": productImage || ogUrl,
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const supabase = await createServerSupabaseClient();
  const result = await getTranslation(supabase, locale, slug);
  if (!result || !result.translation) notFound();

  const { translation } = result;
  const product = translation.product;
  const ogSettings = await getOgSettings(supabase);

  // Fetch category name + product_type separately
  let category: { name: string; product_type: string } | null = null;
  if (product.category_id) {
    const { data: cat } = await supabase
      .from("product_categories").select("name, product_type").eq("id", product.category_id).single();
    category = cat;
  }
  const images = product.image_gallery?.length ? product.image_gallery : (product.images || []).map((u: string) => ({ url: u }));
  // Load specs from normalized table
  const { data: specRows } = await supabase
    .from("product_specs").select("*").eq("product_id", product.id).order("sort_order", { ascending: true });
  const specs = (specRows || []).map((s: any) => ({
    no: s.sort_order,
    label: s.label,
    value: s.value,
    bgColor: s.bg_color || undefined,
    fontSize: s.font_size || undefined,
    color: s.color || undefined,
  }));
  const counters = product.param_counters || [];
  const tabs = product.spec_tabs || [];
  const eco = product.eco_features || [];

  // Fetch page banner toggle (with locale fallback)
  let showBanner = true;
  let vignetteEnabled = true;
  if (supabase) {
    let { data: pg } = await supabase.from("page_contents")
      .select("show_banner, vignette_enabled")
      .eq("page_key", "product-detail").eq("locale", locale).maybeSingle();
    // Fallback to EN if locale-specific not found
    if (!pg && locale !== "en") {
      const { data: pgFallback } = await supabase.from("page_contents")
        .select("show_banner, vignette_enabled")
        .eq("page_key", "product-detail").eq("locale", "en").maybeSingle();
      pg = pgFallback;
    }
    if (pg) { showBanner = pg.show_banner !== false; vignetteEnabled = pg.vignette_enabled !== false; }
  }

  // B2B FAQ — fetch from DB by locale (fallback to EN), fallback to built-in if all empty
  const pt = category?.product_type || null;
  const fetchFaqs = async (l: string, type: string | null) => {
    const { data: g } = await supabase.from("product_faqs").select("*").eq("product_type", "").eq("locale", l).order("sort_order", { ascending: true });
    const { data: t } = type ? await supabase.from("product_faqs").select("*").eq("product_type", type).eq("locale", l).order("sort_order", { ascending: true }) : { data: [] };
    return [...(g || []), ...(t || [])];
  };
  let dbFaqs = (locale !== "en" ? await fetchFaqs(locale, pt) : []);
  if (dbFaqs.length === 0) dbFaqs = await fetchFaqs("en", pt);

  // Hardcoded fallback questions (used when DB has no entries)
  function getFallbackFaqs(productType: string | null): { question: string; answer: string }[] {
    const type = (productType || "").toLowerCase();
    const isCigar = type.includes("cigar") || type.includes("humid");
    const isWine = type.includes("wine");
    const isBeverage = type.includes("beverage") || type.includes("drink");
    const isBar = type.includes("bar") || type.includes("cabinet") || type.includes("liquor");

    const qs: { question: string; answer: string }[] = [
      { question: "What is the minimum order quantity (MOQ) for this product?", answer: "Our standard MOQ is 50–100 units per model for OEM orders. We also offer sample orders of 1–5 units for quality evaluation before bulk commitment. Contact our sales team for specific MOQ details." },
      { question: "What certifications do your products have?", answer: "Our products are certified with CE, RoHS, and ERP for European markets, and ETL/UL for North American markets. We maintain ISO9001 quality management standards across our production facilities." },
      { question: "Do you offer OEM/ODM services?", answer: "Yes, we provide full OEM and ODM services including custom logo printing, RAL/Pantone color matching, custom packaging design, temperature range configuration, and multilingual labeling." },
      { question: "What is the warranty period?", answer: "We offer a standard 1–2 year warranty on all products covering manufacturing defects. Extended warranty options are available for bulk orders and long-term partnerships." },
      { question: "What payment terms do you accept?", answer: "We accept T/T (wire transfer), L/C (letter of credit), and other mutually agreed payment terms. Typical terms are 30% deposit with 70% balance before shipment." },
    ];
    if (isWine) {
      qs.push({ question: "What temperature range does this wine cooler support?", answer: "Our compressor wine coolers support a range of 5°C–22°C (41°F–72°F). Dual-zone models allow independent temperature control for different wine varieties." });
      qs.push({ question: "Compressor vs thermoelectric — which is better for commercial use?", answer: "For commercial use, compressor wine coolers are recommended. They handle higher ambient temperatures and are available in larger capacities (up to 320+ bottles)." });
    }
    if (isCigar) {
      qs.push({ question: "What type of wood is used for the cabinet interior?", answer: "Our cigar cabinets feature Spanish cedar interiors, the industry standard. Spanish cedar maintains proper humidity, resists mold, and enhances cigar aging." });
      qs.push({ question: "What humidity levels does this cabinet maintain?", answer: "Our electric humidors maintain 54°F–74°F temperature and 65%–75% RH humidity for optimal cigar preservation." });
    }
    if (isBeverage) {
      qs.push({ question: "What temperature range does this beverage cooler support?", answer: "Our beverage coolers operate at 2°C–18°C (35°F–65°F), suitable for beers, wines, sodas, and more." });
      qs.push({ question: "Built-in or freestanding installation?", answer: "Many models support both. Built-in models feature front-ventilation for flush under-counter installation." });
    }
    if (isBar) {
      qs.push({ question: "What materials and finishes are available?", answer: "We offer solid wood, engineered wood veneers, stainless steel, and tempered glass. Custom RAL colors are available for hospitality projects." });
      qs.push({ question: "Can bar cabinets be customized for hotel projects?", answer: "Yes, we specialize in custom solutions for hotels and hospitality — dimensions, finishes, integrated refrigeration, lockable doors, and LED lighting." });
    }
    qs.push({ question: `How long does shipping take for ${(productType || "this product").toLowerCase()} orders?`, answer: "Production lead time is 25–40 days after deposit. Shipping: 15–25 days to North America, 20–30 days to Europe by sea. Air freight available." });
    return qs;
  }

  const faqs = dbFaqs.length > 0 ? dbFaqs : getFallbackFaqs(pt);
  const faqTitle = locale === "zh" ? "❓ 常见问题 (B2B)" : "❓ B2B FAQ";

  return (
    <>
      <Header />
      <main style={{ paddingTop: "64px" }}>
        {showBanner && <PageBannerCarousel pageKey="product-detail" vignette={vignetteEnabled} />}

        <Breadcrumbs items={[
          { label: locale === "zh" ? "产品中心" : "Products", href: `/${locale}/products` },
          ...(category?.product_type && category.product_type !== category?.name
            ? [{ label: category.product_type, href: `/${locale}/products?type=${encodeURIComponent(category.product_type)}` }]
            : []),
          ...(category?.name ? [{ label: category.name, href: `/${locale}/products?type=${encodeURIComponent(category.product_type || "")}&cat=${product.category_id}` }] : []),
          { label: product.model_number },
        ]} />

        {/* JSON-LD Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: renderJsonLd(productSchema({
              name: translation.name,
              description: translation.description,
              image: images?.[0]?.url || undefined,
              brand: ogSettings.brand,
              sku: product.model_number,
            }))
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: renderJsonLd(breadcrumbListSchema([
              { name: locale === "zh" ? "产品中心" : "Products", url: `https://xmoso.com${locale === "en" ? "" : `/${locale}`}/products` },
              ...(category?.name ? [{ name: category.name, url: `https://xmoso.com${locale === "en" ? "" : `/${locale}`}/products?type=${encodeURIComponent(category.product_type || "")}&cat=${product.category_id}` }] : []),
              { name: product.model_number, url: `https://xmoso.com${locale === "en" ? "" : `/${locale}`}/products/${slug}` },
            ]))
          }}
        />

        {/* FAQ Schema for B2B buyers */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: renderJsonLd(faqPageSchema(faqs.map((f: any) => ({ question: f.question, answer: f.answer }))))
          }}
        />

        <div className="max-w-7xl mx-auto px-4">

          {/* Floating share — left side (desktop only) */}
          <div className="hidden md:block fixed left-0 top-1/2 -translate-y-1/2 z-40" style={{ marginTop: "32px" }}>
            <ShareButton url={`/${locale}/products/${slug}`} title={translation.name} floating />
          </div>

          {/* Image + Info + SPEC */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <ImageGallery images={images} />
            <div>
              <h1 className="text-3xl md:text-4xl font-light tracking-wider text-white">{translation.name}</h1>
              <div className="mt-3">
                <ShareButton url={`/${locale}/products/${slug}`} title={translation.name} />
              </div>
              <div className="flex items-center gap-3 mt-3">
                <p className="text-silver/50 text-sm">{product.model_number}</p>
                <SpecSheetButton slug={slug} locale={locale} modelNumber={product.model_number} />
              </div>
              <p className="text-silver/60 mt-6 leading-relaxed">{translation.description}</p>
              {/* SPEC right below description */}
              {specs.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg text-white tracking-wide mb-4">📋 Technical Specifications</h3>
                  <SpecTable specs={specs} />
                </div>
              )}
            </div>
          </div>

          {/* Installation Media */}
          {product.installation_media?.length > 0 && (
            <InstallationMedia media={product.installation_media} />
          )}

          {/* Param Counters */}
          {counters.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-16">
              {counters.map((pc: any, i: number) => (
                <ParamCounter key={i} label={pc.label} value={pc.value} unit={pc.unit} icon={pc.icon} />
              ))}
            </div>
          )}

          {/* Rich Content */}
          {(product.content?.[`_${locale}`]?.blocks?.length > 0 ? product.content[`_${locale}`] : product.content) && (
            <div className="mb-16 p-8 bg-deep-blue/20 border border-silver/10 rounded-xl">
              <h3 className="text-xl text-white tracking-wide mb-6">📖 Details</h3>
              <RichContent content={product.content?.[`_${locale}`]?.blocks ? product.content[`_${locale}`] : product.content} />
            </div>
          )}

          {/* Interactive Tabs */}
          {tabs.length > 0 && (
            <div className="mb-16">
              <SpecTabs tabs={tabs} />
            </div>
          )}

          {/* Eco Panel */}
          {eco.length > 0 && (
            <div className="bg-deep-blue/20 border border-forest/20 rounded-xl p-8 mb-16">
              <h3 className="text-xl text-forest tracking-wide mb-4">🌱 Sustainability</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                {eco.map((f: any, i: number) => (
                  <div key={i}>
                    <span className={`text-2xl font-light ${f.color === "forest" ? "text-forest" : "text-ice"}`}>{f.value}</span>
                    <p className="text-xs text-silver/50 mt-1">{f.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQ Section */}
          {faqs.length > 0 && (
            <div className="mb-16 p-8 bg-deep-blue/20 border border-silver/10 rounded-xl">
              <FaqAccordion faqs={faqs} title={faqTitle} />
            </div>
          )}

          {/* Inquiry */}
          <div className="max-w-xs mx-auto pb-8">
            <FloatingInquiry locale={locale} productName={translation.name} productModel={product.model_number} productId={product.id} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
