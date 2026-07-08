"use client";
import { useRef, useEffect, useState } from "react";
import ProductCard from "./ProductCard";

interface Product {
  slug: string; name: string; model_number: string; image: string; highlights: string[]; product_style: string;
}

interface ProductGridProps { products: Product[]; locale: string; selectable?: boolean; }

function AnimatedProduct({ product, locale, selectable, index }: {
  product: Product; locale: string; selectable?: boolean; index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { rootMargin: "0px 0px -50px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.5s ease-out, transform 0.5s ease-out`,
        transitionDelay: `${index * 0.05}s`,
      }}
    >
      <ProductCard
        slug={product.slug} name={product.name} image={product.image}
        locale={locale} highlights={product.highlights} productStyle={product.product_style}
        selectable={selectable}
      />
    </div>
  );
}

export default function ProductGrid({ products, locale, selectable }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
      {products.map((product, i) => (
        <AnimatedProduct key={product.slug} product={product} locale={locale} selectable={selectable} index={i} />
      ))}
    </div>
  );
}
