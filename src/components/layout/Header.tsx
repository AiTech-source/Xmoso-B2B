"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useLocale } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";

// Read logo directly from localStorage — runs synchronously before first render
function getInitialLogo(): string {
  if (typeof window === "undefined") return "";
  try { return localStorage.getItem("logo_url") || ""; } catch { return ""; }
}

export default function Header() {
  const locale = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState(getInitialLogo);
  const isZh = locale === "zh";

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.logo_url) {
          setLogoUrl(data.logo_url);
          localStorage.setItem("logo_url", data.logo_url);
        }
      })
      .catch(() => {});
  }, []);

  const links = [
    { href: `/${locale}`, label: isZh ? "首页" : "Home" },
    { href: `/${locale}/products`, label: isZh ? "产品中心" : "Products" },
    { href: `/${locale}/blog`, label: isZh ? "新闻" : "Blog" },
    { href: `/${locale}/about`, label: isZh ? "关于我们" : "About Us" },
    { href: `/${locale}/contact`, label: isZh ? "联系我们" : "Contact Us" },
    { href: `/${locale}/faq`, label: isZh ? "常见问题" : "FAQ" },
  ];

  return (
    <>
      <style>{`
        @media (min-width: 768px) { .h-desk { display: flex !important; } .h-mob { display: none !important; } }
        @media (max-width: 767px) { .h-desk { display: none !important; } .h-mob { display: flex !important; } }
      `}</style>
      <header className="fixed top-0 left-0 right-0 z-50 bg-deep-dark/80 backdrop-blur-md border-b border-silver/10" style={{ height: "64px" }}>
        <nav className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <Link href={`/${locale}`} style={{ textDecoration: "none", display: "flex", alignItems: "center" }} className="text-xl font-bold tracking-widest text-white">
            {logoUrl ? (
              <img src={logoUrl} fetchPriority="high" alt="Logo" style={{ height: "32px", maxWidth: "160px" }} className="object-contain" />
            ) : null}
          </Link>

          {/* Desktop nav */}
          <div className="h-desk" style={{ alignItems: "center", gap: "2rem" }}>
            {links.map((link) => (
              <Link key={link.href} href={link.href} style={{ color: "#C0C0C0", fontSize: "14px", letterSpacing: "0.05em", textDecoration: "none" }}
                className="hover:text-white transition-colors whitespace-nowrap">
                {link.label}
              </Link>
            ))}
            <LanguageSwitcher />
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="h-mob" style={{ alignItems: "center", justifyContent: "center", background: "none", border: "none", padding: "8px", cursor: "pointer", color: "white" }}
            aria-label="Menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </nav>
        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              style={{ position: "absolute", top: "64px", left: 0, right: 0, background: "rgba(10,10,15,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(192,192,192,0.1)" }}>
              <div className="flex flex-col p-6 gap-4">
                {links.map((link) => (
                  <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
                    style={{ color: "#C0C0C0", fontSize: "18px", letterSpacing: "0.05em", textDecoration: "none" }}
                    className="hover:text-white transition-colors">{link.label}</Link>
                ))}
                <div style={{ marginTop: "8px" }}><LanguageSwitcher /></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
