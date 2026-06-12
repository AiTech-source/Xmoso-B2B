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

            {typeGroups.map((group) => {
              const typeCount = group.categories.reduce((s, c) => s + c.products.length, 0);
              return (
              <section
                key={group.name}
                id={typeAnchor(group.name)}
                className="mb-16 scroll-mt-24"
              >
                {/* ── Type heading ── */}
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-2xl font-light tracking-wider text-white">
                    {group.name}
                  </h2>
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-forest/10 text-forest/80 font-medium tracking-wide">
                    {typeCount} {locale === "zh" ? "款" : "models"}
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-forest/40 to-transparent ml-2" />
                </div>

                {/* ── Categories within this type ── */}
                {group.categories.map((cat) => (
                  <div key={cat.id} id={typeAnchor(group.name) + "-c-" + cat.id} className="mb-10 scroll-mt-24">
                    {group.categories.length > 1 && (
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-1 h-4 bg-ice/50 rounded-full" />
                        <h3 className="text-sm tracking-wider text-ice/80 font-medium">
                          {cat.name}
                        </h3>
                        <span className="text-[10px] text-silver/30">({cat.products.length})</span>
                      </div>
                    )}
                    <ProductGrid products={cat.products} locale={locale} />
                  </div>
                ))}
              </section>
            );
          })}

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
