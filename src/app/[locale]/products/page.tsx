import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import PageBannerCarousel from "@/components/layout/PageBannerCarousel";
import ProductGrid from "@/components/products/ProductGrid";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ogImageUrl, getOgSettings } from "@/lib/seo/og";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const supabase = await createServerSupabaseClient();
  const ogSet = await getOgSettings(supabase);
  const title = locale === "zh" ? "产品中心" : "Products";
  return {
    title,
    alternates: { canonical: `/${locale}/products` },
    openGraph: {
      type: "website",
      title: `${ogSet.brand} — ${title}`,
      images: [{ url: ogImageUrl({ title, subtitle: "Wine Cooling Cabinets", type: "page", brand: ogSet.brand }), width: 1200, height: 630 }],
    },
  };
}

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string; cat?: string }>;
}) {
  const { locale } = await params;
  const { type, cat } = await searchParams;
  const supabase = await createServerSupabaseClient();

  // Fetch categories grouped by product_type
  const { data: allCategories } = await supabase
    .from("product_categories").select("*").order("product_type").order("sort_order");

  // Group categories by product_type
  const typeMap = new Map<string, any[]>();
  const typeList: string[] = [];
  for (const c of allCategories || []) {
    if (!typeMap.has(c.product_type)) {
      typeMap.set(c.product_type, []);
      typeList.push(c.product_type);
    }
    typeMap.get(c.product_type)!.push(c);
  }

  // Determine active product type
  const activeType = type || typeList[0] || "";
  const activeCategories = typeMap.get(activeType) || [];

  // Fetch products
  let query = supabase
    .from("product_translations")
    .select("slug, name, product_id, product:products(model_number, energy_rating, images, image_gallery, category_id, sort_order, specifications, highlights, product_style)")
    .eq("locale", locale);

  // Filter by category
  const activeCatIds = cat
    ? [cat]
    : activeCategories.map((c: any) => c.id);

  if (cat) {
    query = query.eq("product.category_id", cat);
  } else if (activeCatIds.length > 0) {
    query = query.in("product.category_id", activeCatIds);
  }

  // Only show active/published products on the frontend
  query = query.eq("product.is_active", true);

  const { data: translations, error: transErr } = await query;
  if (transErr) console.error("Products query error:", transErr);

  // Fetch page banner toggle
  let showBanner = true;
  let vignetteEnabled = true;
  if (supabase) {
    const { data: pg } = await supabase.from("page_contents")
      .select("show_banner, vignette_enabled")
      .eq("page_key", "products").eq("locale", locale).maybeSingle();
    if (pg) { showBanner = pg.show_banner !== false; vignetteEnabled = pg.vignette_enabled !== false; }
  }

  // Sort by sort_order ascending (nulls at the end)
  (translations || []).sort((a: any, b: any) => (a.product?.sort_order ?? 999) - (b.product?.sort_order ?? 999));

  const products = (translations || [])
    .filter((t: any) => t.product)
    .map((t: any) => ({
      slug: t.slug, name: t.name, model_number: t.product.model_number,
      image: t.product.image_gallery?.[0]?.url || t.product.images?.[0] || "",
      highlights: t.product.highlights || [],
      product_style: t.product.product_style || "",
    }));

  return (
    <>
      <Header />
      <main style={{ paddingTop: "64px" }}>
        {showBanner && <PageBannerCarousel pageKey="products" vignette={vignetteEnabled} />}
        <Breadcrumbs items={[
          ...(type ? [{ label: "Products", href: `/${locale}/products` }, { label: activeType }] : [{ label: "Products" }]),
          ...(cat && activeCategories.find((c: any) => c.id === cat)
            ? [{ label: activeCategories.find((c: any) => c.id === cat).name }]
            : []),
        ]} />

        <div className="max-w-7xl mx-auto px-4" id="products-content">
          {/* Product Type tabs */}
          {typeList.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6 mt-4">
              {typeList.map((pt) => (
                <Link key={pt} href={`/${locale}/products${pt === typeList[0] && !type ? "" : `?type=${encodeURIComponent(pt)}`}`} scroll={false}
                  className={`px-4 py-2 text-sm rounded-full border transition-colors ${
                    activeType === pt ? "bg-forest/20 text-forest border-forest/30" : "bg-transparent text-silver/50 border-silver/20 hover:text-white"
                  }`}>
                  {pt}
                </Link>
              ))}
            </div>
          )}

          {/* Category tabs within product type */}
          {activeCategories.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-8">
              <Link href={`/${locale}/products?type=${encodeURIComponent(activeType)}`} scroll={false}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                  !cat ? "bg-ice/20 text-ice border-ice/30" : "bg-transparent text-silver/50 border-silver/20 hover:text-white"
                }`}>
                All {activeType}
              </Link>
              {activeCategories.map((c: any) => (
                <Link key={c.id} href={`/${locale}/products?type=${encodeURIComponent(activeType)}&cat=${c.id}`} scroll={false}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                    cat === c.id ? "bg-ice/20 text-ice border-ice/30" : "bg-transparent text-silver/50 border-silver/20 hover:text-white"
                  }`}>
                  {c.name}
                </Link>
              ))}
            </div>
          )}

          <ProductGrid products={products} locale={locale} />
        </div>
      </main>
      <Footer />
    </>
  );
}
