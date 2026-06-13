"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "@/components/layout/ThemeToggle";

const links = [
  { href: "/admin/dashboard", label: "📊 Dashboard" },
  { href: "/admin/banners", label: "🎠 Banners" },
  { href: "/admin/pages", label: "📝 Pages" },
  { href: "/admin/product-types", label: "📦 Product Types" },
  { href: "/admin/categories", label: "📁 Categories" },
  { href: "/admin/products", label: "📦 Products" },
  { href: "/admin/translations", label: "🌐 Translations" },
  { href: "/admin/spec-templates", label: "📋 Spec Templates" },
  { href: "/admin/faq", label: "📋 FAQ" },
  { href: "/admin/inquiries", label: "📨 Inquiries" },
  { href: "/admin/analytics", label: "📈 Analytics" },
  { href: "/admin/settings", label: "⚙️ Settings" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  async function handleLogout() {
    try { const supabase = createClient(); if (supabase) await supabase.auth.signOut(); } catch (_) {}
    router.push("/admin/login");
  }
  return (
    <aside className="w-64 bg-deep-blue/30 border-r border-silver/10 h-screen p-6 fixed left-0 top-0 flex flex-col">
      <div className="flex-shrink-0">
        <h2 className="text-lg font-bold tracking-widest text-white mb-8">
          DEEP<span className="text-forest">COOL</span>
          <span className="block text-xs text-silver/40 font-normal mt-1">Admin Panel</span>
        </h2>
      </div>
      <nav className="flex flex-col gap-2 flex-1 overflow-y-auto min-h-0">
        {links.map((link) => (
          <Link key={link.href} href={link.href}
            className={`px-4 py-3 rounded-lg text-sm tracking-wide transition-colors ${
              pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href))
                ? "bg-forest/20 text-forest border border-forest/20"
                : "text-silver/60 hover:text-white hover:bg-white/5"
            }`}>{link.label}</Link>
        ))}
        <span className="mt-auto" />
        <ThemeToggle />
      </nav>
      <button onClick={handleLogout} className="w-full px-4 py-3 text-sm text-silver/40 hover:text-red-400 transition-colors text-left">← Sign Out</button>
    </aside>
  );
}
