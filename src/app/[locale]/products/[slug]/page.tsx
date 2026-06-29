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
    twitter: {
      card: "summary_large_image",
      title: translation.meta_title || translation.name,
      description: translation.meta_description || translation.description || undefined,
      images: [productImage || ogUrl],
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

  // B2B FAQ title — component fetches data client-side via API
  const pt = category?.product_type || null;
  const faqTitle = locale === "zh" ? "❓ 常见问题 (B2B)" : "❓ B2B FAQ";

  // Related Products — manual from DB (relatedProductIds), fallback to auto by category
  const manualIds = product.content?.relatedProductIds || [];
  let relatedProductsMapped: any[] = [];
  if (manualIds.length > 0) {
    const { data: manualTrans } = await supabase
      .from("product_translations")
      .select("slug, name, product_id, product:products(id, model_number, image_gallery)")
      .eq("locale", locale)
      .in("product_id", manualIds);
    relatedProductsMapped = (manualTrans || []).filter((t: any) => t.product?.id !== product.id).map((t: any) => ({
      id: t.product?.id,
      slug: t.slug,
      name: t.name,
      model_number: t.product?.model_number || "",
      image: t.product?.image_gallery?.[0]?.url || "",
    }));
  } else if (product.category_id) {
    // Auto fallback: same category
    const { data: autoTrans } = await supabase
      .from("product_translations")
      .select("slug, name, product:products(id, model_number, image_gallery)")
      .eq("locale", locale)
      .eq("product.category_id", product.category_id)
      .neq("product_id", product.id)
      .limit(6);
    relatedProductsMapped = (autoTrans || []).map((t: any) => ({
      id: t.product?.id,
      slug: t.slug,
      name: t.name,
      model_number: t.product?.model_number || "",
      image: t.product?.image_gallery?.[0]?.url || "",
    }));
  }

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

        {/* FAQ Schema for B2B buyers — simple generic schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: renderJsonLd(faqPageSchema([
              { question: "What is the minimum order quantity (MOQ)?", answer: "Standard MOQ 50–100 units per model. Sample orders of 1–5 units available." },
              { question: "What certifications do your products have?", answer: "CE, RoHS, ERP, ETL/UL, ISO9001." },
              { question: "Do you offer OEM/ODM services?", answer: "Yes, full OEM/ODM services including custom logo, colors, packaging, and configuration." },
            ]))
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

          {/* Related Products */}
          {(() => {
            const related = relatedProductsMapped?.slice(0, 4);
            if (!related?.length) return null;
            return (
              <div className="mb-16">
                <h3 className="text-xl text-white tracking-wide mb-6">{locale === "zh" ? "🔗 相关产品" : "🔗 Related Products"}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {related.map((p: any) => (
                    <a key={p.id} href={`/${locale}/products/${p.slug}`}
                      className="group block bg-deep-blue/20 border border-silver/10 rounded-xl p-4 hover:border-forest/30 hover:bg-deep-blue/40 transition-all">
                      <div className="aspect-square bg-deep-dark/40 rounded-lg overflow-hidden mb-3 flex items-center justify-center">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-contain p-3" width={200} height={200} loading="lazy" />
                        ) : (
                          <span className="text-3xl text-silver/20">🍷</span>
                        )}
                      </div>
                      <p className="text-white text-xs font-medium leading-snug group-hover:text-forest transition-colors line-clamp-2">{p.name}</p>
                      <p className="text-[10px] text-silver/40 mt-1">{p.model_number}</p>
                    </a>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* FAQ Section */}
          <div className="mb-16 p-8 bg-deep-blue/20 border border-silver/10 rounded-xl">
            <FaqAccordion locale={locale} productType={pt} title={faqTitle} />
          </div>

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
