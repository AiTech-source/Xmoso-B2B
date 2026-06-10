"use client";
import Link from "next/link";
interface ProductCardProps {
  slug: string; name: string; image: string; locale: string;
  highlights: string[]; productStyle: string;
}
export default function ProductCard({ slug, name, image, locale, highlights, productStyle }: ProductCardProps) {
  return (
    <Link href={`/${locale}/products/${slug}`} className="group block">
      <div className="relative">
        {/* Image */}
        <div className="aspect-[4/3] overflow-hidden rounded-sm border border-silver/10 group-hover:border-forest/30 transition-colors">
          {image ? (
            <img src={image} alt={name} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-700" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-deep-blue/20">
              <span className="text-silver/20 text-6xl">🍷</span>
            </div>
          )}
        </div>

        {/* Name + Style */}
        <div className="mt-4">
          <h3 className="text-[15px] text-white font-light tracking-wide leading-snug">{name}</h3>
          {productStyle && (
            <p className="text-[13px] text-forest mt-1 tracking-wider font-medium">{productStyle}</p>
          )}
        </div>

        {/* Highlights */}
        {highlights.length > 0 && (
          <ul className="mt-2.5 space-y-0.5">
            {highlights.slice(0, 5).map((h, i) => (
              <li key={i} className="text-[13px] text-silver/60 leading-relaxed">{h}</li>
            ))}
          </ul>
        )}
      </div>
    </Link>
  );
}
