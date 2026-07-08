"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ProductCard from "@/components/products/ProductCard";
import CompareBar from "@/components/products/CompareBar";
import { typeAnchor } from "@/lib/products-by-type";

interface Product {
  slug: string; name: string; model_number: string; image: string; highlights: string[]; product_style: string;
}

interface TypeGroup {
  name: string;
  sort_order: number;
  products: Product[];
}

function AnimatedGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); }}, { rootMargin: "0px 0px -50px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={className}
      style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(30px)", transition: "opacity 0.5s ease-out, transform 0.5s ease-out" }}>
      {children}
    </div>
  );
}

function AnimatedCard({ children, delay }: { children: React.ReactNode; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); }}, { rootMargin: "0px 0px -50px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref}
      style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: `opacity 0.4s ease-out ${delay}s, transform 0.4s ease-out ${delay}s` }}>
      {children}
    </div>
  );
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
        <div className="h-8 w-1/3 bg-silver/5 rounded mb-8 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-10">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[4/3] bg-silver/5 rounded-sm" />
              <div className="mt-4 h-5 w-3/4 bg-silver/5 rounded" />
              <div className="mt-2 h-4 w-1/2 bg-silver/5 rounded" />
              <div className="mt-3 space-y-1">
                {[1, 2, 3].map((j) => <div key={j} className="h-3 w-full bg-silver/5 rounded" />)}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (typeGroups.length === 0) return null;

  const t = (en: string, zh: string) => (locale === "zh" ? zh : en);

  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      {typeGroups.map((group, gi) => (
        <AnimatedGroup key={group.name} className="mb-16">
          <h2 className="text-2xl font-light tracking-wider text-white mb-2">{group.name}</h2>
          <div className="w-12 h-0.5 bg-forest/60 mb-8" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-10">
            {group.products.map((product, i) => (
              <AnimatedCard key={product.slug} delay={i * 0.05}>
                <ProductCard
                  slug={product.slug} name={product.name} image={product.image}
                  locale={locale} highlights={product.highlights} productStyle={product.product_style} selectable
                />
              </AnimatedCard>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href={`/${locale}/products#${typeAnchor(group.name)}`}
              className="inline-block px-8 py-3 border border-forest/40 text-forest rounded-full text-sm tracking-wider hover:bg-forest/10 transition-all">
              {t("View All", "查看全部")} {group.name} →
            </Link>
          </div>

          {gi < typeGroups.length - 1 && <div className="mt-16 border-t border-silver/10" />}
        </AnimatedGroup>
      ))}

      {typeGroups.length > 0 && (
        <div className="text-center mt-8">
          <Link href={`/${locale}/products`}
            className="inline-block px-10 py-4 bg-forest/80 text-white rounded-full text-sm tracking-wider hover:bg-forest transition-all">
            {t("Browse All Products", "浏览所有产品")} →
          </Link>
        </div>
      )}
      <CompareBar />
    </section>
  );
}
