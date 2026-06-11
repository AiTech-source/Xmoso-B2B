"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import ProductCard from "@/components/products/ProductCard";
import { typeAnchor } from "@/lib/products-by-type";

interface Product {
  slug: string; name: string; model_number: string; image: string; highlights: string[]; product_style: string;
}

interface TypeGroup {
  name: string;
  sort_order: number;
  products: Product[];
}

export default function HomeProducts({ locale }: { locale: string }) {
  const [typeGroups, setTypeGroups] = useState<TypeGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products-by-type?locale=${locale}&limit=6`)
      .then((r) => r.json())
      .then((data) => {
        setTypeGroups(data.types || []);
        setLoading(false);
      });
  }, [locale]);

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center text-silver/40 text-sm py-12">Loading...</div>
      </section>
    );
  }

  if (typeGroups.length === 0) return null;

  const t = (en: string, zh: string) => (locale === "zh" ? zh : en);

  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      {typeGroups.map((group, gi) => (
        <motion.div
          key={group.name}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-16"
        >
          {/* ── Type heading ── */}
          <h2 className="text-2xl font-light tracking-wider text-white mb-2">
            {group.name}
          </h2>
          <div className="w-12 h-0.5 bg-forest/60 mb-8" />

          {/* ── Products grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-10">
            {group.products.map((product, i) => (
              <motion.div
                key={product.slug}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.05, duration: 0.4, ease: "easeOut" }}
              >
                <ProductCard
                  slug={product.slug}
                  name={product.name}
                  image={product.image}
                  locale={locale}
                  highlights={product.highlights}
                  productStyle={product.product_style}
                />
              </motion.div>
            ))}
          </div>

          {/* ── View All link ── */}
          <div className="text-center mt-8">
            <Link
              href={`/${locale}/products#${typeAnchor(group.name)}`}
              className="inline-block px-8 py-3 border border-forest/40 text-forest rounded-full text-sm tracking-wider hover:bg-forest/10 transition-all"
            >
              {t("View All", "查看全部")} {group.name} →
            </Link>
          </div>

          {/* ── Separator ── */}
          {gi < typeGroups.length - 1 && (
            <div className="mt-16 border-t border-silver/10" />
          )}
        </motion.div>
      ))}

      {/* ── Bottom CTA ── */}
      {typeGroups.length > 0 && (
        <div className="text-center mt-8">
          <Link
            href={`/${locale}/products`}
            className="inline-block px-10 py-4 bg-forest/80 text-white rounded-full text-sm tracking-wider hover:bg-forest transition-all"
          >
            {t("Browse All Products", "浏览所有产品")} →
          </Link>
        </div>
      )}
    </section>
  );
}
