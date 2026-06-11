"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import ProductCard from "@/components/products/ProductCard";

interface Product {
  slug: string; name: string; model_number: string; image: string; highlights: string[]; product_style: string;
}

export default function HomeProducts({ locale }: { locale: string }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [typeNames, setTypeNames] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeType, setActiveType] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [loading, setLoading] = useState(true);

  // Group categories by product_type
  const typeMap = new Map<string, any[]>();
  for (const c of categories) {
    if (!typeMap.has(c.product_type)) {
      typeMap.set(c.product_type, []);
    }
    typeMap.get(c.product_type)!.push(c);
  }
  const activeCategories = typeMap.get(activeType) || [];

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then(r => r.json()),
      fetch("/api/product-types").then(r => r.json()),
    ]).then(([catData, ptData]) => {
      const cats = catData.categories || [];
      setCategories(cats);
      // Only show types that have at least one category
      const typesWithCats = new Set(cats.map((c: any) => c.product_type));
      const names = (ptData.types || []).map((t: any) => t.name).filter((n: string) => typesWithCats.has(n));
      setTypeNames(names);
      if (names.length > 0) setActiveType(names[0]);
    });
  }, []);

  useEffect(() => {
    if (!activeType) return;
    setLoading(true);
    setActiveCat("all");

    const catIds = activeCategories.map((c: any) => c.id);

    fetch(`/api/home-products?locale=${locale}&type=${encodeURIComponent(activeType)}&cats=${catIds.join(",")}`)
      .then(r => r.json())
      .then(data => {
        setProducts(data.products || []);
        setLoading(false);
      });
  }, [activeType]);

  useEffect(() => {
    if (activeCat === "all" || !activeCat) return;
    setLoading(true);

    fetch(`/api/home-products?locale=${locale}&cat=${activeCat}`)
      .then(r => r.json())
      .then(data => {
        setProducts(data.products || []);
        setLoading(false);
      });
  }, [activeCat]);

  if (typeNames.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      {/* Product Type tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {typeNames.map((pt) => (
          <button key={pt} onClick={() => setActiveType(pt)}
            className={`px-4 py-2 text-sm rounded-full border transition-colors ${
              activeType === pt ? "bg-forest/20 text-forest border-forest/30" : "bg-transparent text-silver/50 border-silver/20 hover:text-white"
            }`}>
            {pt}
          </button>
        ))}
      </div>

      {/* Category tabs within product type */}
      {activeCategories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setActiveCat("all")}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
              activeCat === "all" ? "bg-ice/20 text-ice border-ice/30" : "bg-transparent text-silver/50 border-silver/20 hover:text-white"
            }`}>
            All {activeType}
          </button>
          {activeCategories.map((c: any) => (
            <button key={c.id} onClick={() => setActiveCat(c.id)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                activeCat === c.id ? "bg-ice/20 text-ice border-ice/30" : "bg-transparent text-silver/50 border-silver/20 hover:text-white"
              }`}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Products */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeType + (activeCat === "all" ? "" : activeCat)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {loading ? (
            <div className="text-center text-silver/40 text-sm py-12">Loading...</div>
          ) : products.length === 0 ? (
            <div className="text-center text-silver/40 text-sm py-12">No products in this category yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-10">
              {products.slice(0, 6).map((product, i) => (
                <motion.div key={product.slug}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4, ease: "easeOut" }}
                >
                  <ProductCard
                    slug={product.slug} name={product.name}
                    image={product.image} locale={locale} highlights={product.highlights}
                    productStyle={product.product_style}
                  />
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link href={`/${locale}/products#products-content`}
              className="inline-block px-8 py-3 border border-forest/40 text-forest rounded-full text-sm tracking-wider hover:bg-forest/10 transition-all">
              View All Products →
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
