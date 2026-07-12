"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";
import { usePathname } from "next/navigation";
import { localePath } from "@/lib/locale-path";

const MobileMenu = dynamic(() => import("./MobileMenu"), { ssr: false });

// Read logo + sustainable visibility synchronously from localStorage
function getInitialLogo(): string {
  if (typeof window === "undefined") return "";
  try { return localStorage.getItem("logo_url") || ""; } catch { return ""; }
}
export default function Header() {
  const locale = useLocale();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState(getInitialLogo);
  // null = not yet determined (show nothing), then true/false after fetch
  const [showSustainable, setShowSustainable] = useState<boolean | null>(null);
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

    // Check if sustainable page is published
    fetch("/api/page-content?page=sustainable&locale=en")
      .then((r) => r.json())
      .then((data) => {
        const sd = data?.content?.sustainableData;
        const published = sd?.published !== false;
        setShowSustainable(published);
        try { localStorage.setItem("sustainable_published", String(published)); } catch {}
      })
      .catch(() => {});
  }, []);

  const t_nav = useTranslations("nav");
  const p = locale === "en" ? "" : `/${locale}`;
  const links = [
    { href: p || "/", label: t_nav("home") },
    { href: `${p}/products`, label: t_nav("products") },
    { href: `${p}/blog`, label: t_nav("blog") },
    { href: `${p}/sourcing`, label: t_nav("sourcing") },
    ...(showSustainable ? [{ href: `${p}/sustainable`, label: t_nav("sustainable") }] : []),
    { href: `${p}/about`, label: t_nav("about") },
    { href: `${p}/contact`, label: t_nav("contact") },
    { href: `${p}/faq`, label: t_nav("faq") },
  ];

  return (
    <>
      <style>{`
        @media (min-width: 768px) { .h-desk { display: flex !important; } .h-mob { display: none !important; } }
        @media (max-width: 767px) { .h-desk { display: none !important; } .h-mob { display: flex !important; } }
        .nav-link { font-size: 12px; letter-spacing: 0.04em; text-decoration: none; position: relative;
          color: #C0C0C0; transition: color 0.2s ease; }
        .nav-link:hover { color: #FFFFFF !important; }
        .nav-link.active { color: #009f4b !important; }
      `}</style>
      <header className="fixed top-0 left-0 right-0 z-50 bg-deep-dark/80 backdrop-blur-md border-b border-silver/10" style={{ height: "64px" }}>
        <nav className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <Link href={localePath(locale)} style={{ textDecoration: "none", display: "flex", alignItems: "center" }} className="text-xl font-bold tracking-widest text-white">
            {/* suppressHydrationWarning: logoUrl is hydrated from localStorage (set by root layout inline script).
                Server renders empty div; client immediately gets logo from localStorage before hydration. */}
            <div style={{ height: "32px", width: "160px", display: "flex", alignItems: "center" }} suppressHydrationWarning>
              {logoUrl ? (
                <img src={logoUrl} fetchPriority="high" alt="Logo" width="160" height="32" style={{ height: "32px", maxWidth: "160px", width: "auto" }} className="object-contain" />
              ) : null}
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="h-desk" style={{ alignItems: "center", gap: "1.1rem" }}>
            {links.map((link) => {
              const cleanPath = pathname === "/" ? "/" : pathname;
              const isActive = cleanPath === link.href
                || (link.href !== "/" && cleanPath.startsWith(link.href + "/"));
              return (
                <Link key={link.href} href={link.href}
                  className={`nav-link ${isActive ? "active" : ""}`}
                  style={{
                    color: isActive ? "#009f4b" : "#C0C0C0",
                    fontSize: "12px",
                    letterSpacing: "0.04em",
                    textDecoration: "none",
                    position: "relative",
                  }}>
                  {link.label}
                  {isActive && (
                    <span style={{
                      position: "absolute", bottom: "-20px", left: "50%", transform: "translateX(-50%)",
                      width: "16px", height: "2px", borderRadius: "1px", backgroundColor: "#009f4b",
                    }} />
                  )}
                </Link>
              );
            })}
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
        <MobileMenu open={menuOpen} links={links} locale={locale} onClose={() => setMenuOpen(false)} />
      </header>
    </>
  );
}
