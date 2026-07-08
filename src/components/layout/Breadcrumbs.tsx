"use client";
import Link from "next/link";
import { useLocale } from "next-intl";

interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const locale = useLocale();
  return (
    <nav className="flex items-center gap-2 text-xs text-silver/50 mb-6 pt-24 px-4 max-w-7xl mx-auto" aria-label="Breadcrumb">
      <Link href={`/${locale}`} className="hover:text-forest transition-colors">🏠 Home</Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          <span className="text-silver/20">/</span>
          {item.href ? (
            <Link href={item.href} className="hover:text-forest transition-colors">{item.label}</Link>
          ) : (
            <span className="text-silver/80">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
