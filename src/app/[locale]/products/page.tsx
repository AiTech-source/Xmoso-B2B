import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import PageBannerCarousel from "@/components/layout/PageBannerCarousel";
import ProductGrid from "@/components/products/ProductGrid";
import ProductsSidebar from "@/components/products/ProductsSidebar";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getProductsByType, typeAnchor } from "@/lib/products-by-type";
import { ogImageUrl, getOgSettings } from "@/lib/seo/og";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const supabase = await createServerSupabaseClient();
  const ogSet = await getOgSettings(supabase);
  const title = locale === "zh" ? "产品中心" : "Products";
  return {
    title,
    alternates: { canonical: locale === "en" ? "/products" : `/${locale}/products` },
    openGraph: {
      type: "website",
      title: `${ogSet.brand} — ${title}`,
      images: [{ url: ogImageUrl({ title, subtitle: "Wine Cooling Cabinets", type: "page", brand: ogSet.brand }), width: 1200, height: 630 }],
    },
  };
}

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createServerSupabaseClient();

  // Fetch all products grouped by type → category (server-side)
  const typeGroups = supabase ? await getProductsByType(supabase, locale) : [];

  // Fetch page banner toggle
  let showBanner = true;
  let vignetteEnabled = true;
  if (supabase) {
    const { data: pg } = await supabase
      .from("page_contents")
      .select("show_banner, vignette_enabled")
      .eq("page_key", "products")
      .eq("locale", locale)
      .maybeSingle();
    if (pg) {
      showBanner = pg.show_banner !== false;
      vignetteEnabled = pg.vignette_enabled !== false;
    }
  }

  // Track total product count for the sidebar summary
  const totalProducts = typeGroups.reduce((sum, g) =>
    sum + g.categories.reduce((s, c) => s + c.products.length, 0), 0,
  );

  return (
    <>
      <Header />
      <main style={{ paddingTop: "64px" }}>
        {showBanner && <PageBannerCarousel pageKey="products" vignette={vignetteEnabled} />}

        <Breadcrumbs items={[{ label: locale === "zh" ? "产品中心" : "Products" }]} />

        <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8">
          {/* ── Left Sidebar Navigation ── */}
          {typeGroups.length > 0 && <ProductsSidebar typeGroups={typeGroups} />}

          {/* ── Main Content ── */}
          <div className="flex-1 min-w-0">
            {/* Summary line */}
            {typeGroups.length > 0 && (
              <p className="text-xs text-silver/40 mb-8">
                {typeGroups.length} {locale === "zh" ? "个产品大类" : "product types"} · {totalProducts} {locale === "zh" ? "款产品" : "products"}
              </p>
            )}

            {typeGroups.map((group) => (
              <section
                key={group.name}
                id={typeAnchor(group.name)}
                className="mb-16 scroll-mt-24"
              >
                {/* ── Type heading ── */}
                <h2 className="text-2xl font-light tracking-wider text-white mb-2">
                  {group.name}
                </h2>
                <div className="w-12 h-0.5 bg-forest/60 mb-8" />

                {/* ── Categories within this type ── */}
                {group.categories.map((cat) => (
                  <div key={cat.id} className="mb-10">
                    {group.categories.length > 1 && (
                      <h3 className="text-sm uppercase tracking-widest text-silver/50 mb-4">
                        {cat.name}
                      </h3>
                    )}
                    <ProductGrid products={cat.products} locale={locale} />
                  </div>
                ))}
              </section>
            ))}

            {typeGroups.length === 0 && (
              <div className="text-center text-silver/40 text-sm py-20">
                {locale === "zh" ? "暂无产品" : "No products yet."}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
