import Header from "@/components/layout/Header";
import { generateLocaleParams } from "@/lib/static-params";
export const generateStaticParams = generateLocaleParams;
import Footer from "@/components/layout/Footer";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import PageBannerCarousel from "@/components/layout/PageBannerCarousel";
import ProductGrid from "@/components/products/ProductGrid";
import ProductsSidebar from "@/components/products/ProductsSidebar";
import CompareBar from "@/components/products/CompareBar";
import { createServerStaticClient } from "@/lib/supabase/server-static";
import { cdnUrl } from "@/lib/cdn";
import { getProductsByType, typeAnchor } from "@/lib/products-by-type";
import { ogImageUrl, getOgSettings } from "@/lib/seo/og";
import { generateAlternates } from "@/lib/seo/hreflang";
import { getBannerPreloadMedia, getInitialPageBanners, getResponsiveBannerPreloads, type PageBannerData } from "@/lib/page-banners";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const supabase = await createServerStaticClient();
  const ogSet = await getOgSettings(supabase);
  const title = locale === "zh" ? "酒柜产品系列 — OEM/ODM 定制酒柜 | Xmoso" : "Wine Cooler Products — OEM Wine Fridge & Custom Beverage Cooler | Xmoso";
  const desc = locale === "zh"
    ? "浏览 Xmoso 全系列酒柜产品：恒温酒柜、双温区酒柜、雪茄柜、饮料柜。支持 OEM/ODM 定制，CE/UL 认证，中国工厂直供。"
    : "Browse Xmoso's full range of wine coolers: single-zone, dual-zone wine cabinets, cigar humidors, and beverage coolers. OEM/ODM custom available, CE/UL certified, China factory direct.";
  return {
    title,
    description: desc,
    alternates: generateAlternates("/products", locale),
    openGraph: {
      type: "website",
      title: `${ogSet.brand} — ${title}`,
      description: desc,
      images: [{ url: ogImageUrl({ title, subtitle: "OEM Wine Cooler China", type: "page", brand: ogSet.brand }), width: 1200, height: 630 }],
    },
  };
}

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createServerStaticClient();

  // Fetch all products grouped by type → category (server-side)
  const typeGroups = supabase ? await getProductsByType(supabase, locale) : [];

  // Fetch page banner toggle + initial banner for SSR
  let showBanner = true;
  let vignetteEnabled = true;
  let initialBanners: PageBannerData[] = [];
  if (supabase) {
    const [{ data: pg }, banners] = await Promise.all([
      supabase.from("page_contents")
        .select("show_banner, vignette_enabled")
        .eq("page_key", "products")
        .eq("locale", locale)
        .maybeSingle(),
      getInitialPageBanners(supabase, "products"),
    ]);
    if (pg) {
      showBanner = pg.show_banner !== false;
      vignetteEnabled = pg.vignette_enabled !== false;
    }
    initialBanners = banners;
  }

  // Track total product count for the sidebar summary
  const totalProducts = typeGroups.reduce((sum, g) =>
    sum + g.categories.reduce((s, c) => s + c.products.length, 0), 0,
  );

  return (
    <>
      {getResponsiveBannerPreloads(initialBanners).map((banner) => (
        <link key={banner.id} rel="preload" as="image" href={cdnUrl(banner.image_url + "?w=1200&q=65")} fetchPriority="high" media={getBannerPreloadMedia(banner)} />
      ))}
      <Header />
      <main style={{ paddingTop: "64px" }}>
        {showBanner && <PageBannerCarousel pageKey="products" vignette={vignetteEnabled} initialBanners={initialBanners} />}

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
                    <ProductGrid products={cat.products} locale={locale} selectable />
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
      <CompareBar />
      <Footer />
    </>
  );
}
