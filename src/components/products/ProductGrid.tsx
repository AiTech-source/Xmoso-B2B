"use client";
import { motion } from "framer-motion";
import ProductCard from "./ProductCard";
interface Product {
  slug: string; name: string; model_number: string; image: string; highlights: string[]; product_style: string;
}
interface ProductGridProps { products: Product[]; locale: string; selectable?: boolean; }
export default function ProductGrid({ products, locale, selectable }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
      {products.map((product, i) => (
        <motion.div key={product.slug} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }} transition={{ delay: i * 0.08, duration: 0.5, ease: "easeOut" }}>
          <ProductCard slug={product.slug} name={product.name} image={product.image}
            locale={locale} highlights={product.highlights} productStyle={product.product_style}
            selectable={selectable} />
        </motion.div>
      ))}
    </div>
  );
}
