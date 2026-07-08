"use client";
import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";

const FALLBACK_LANGUAGES: Record<string, { flag: string; label: string }> = {
  en: { flag: "🇬🇧", label: "English" },
  zh: { flag: "🇨🇳", label: "中文" },
  fr: { flag: "🇫🇷", label: "Français" },
  de: { flag: "🇩🇪", label: "Deutsch" },
  no: { flag: "🇳🇴", label: "Norsk" },
  fi: { flag: "🇫🇮", label: "Suomi" },
  sv: { flag: "🇸🇪", label: "Svenska" },
};

const LOCALE_CODES = Object.keys(FALLBACK_LANGUAGES);

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
}

type LangEntry = { locale: string; enabled: boolean; flag: string; label: string; native: string };

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [enabledLocales, setEnabledLocales] = useState<Record<string, { flag: string; label: string }> | null>(null);

  useEffect(() => {
    fetch("/api/languages")
      .then((r) => r.json())
      .then((data) => {
        const langs: LangEntry[] = data?.languages || [];
        const enabled: Record<string, { flag: string; label: string }> = {};
        for (const l of langs) {
          if (l.enabled) {
            enabled[l.locale] = { flag: l.flag, label: l.label };
          }
        }
        setEnabledLocales(enabled);
      })
      .catch(() => setEnabledLocales(FALLBACK_LANGUAGES));
  }, []);

  const LANGUAGES = enabledLocales || FALLBACK_LANGUAGES;

  /**
   * Switch locale using Next.js router (client-side navigation) instead of
   * window.location.href. This avoids a full-page reload, preserving:
   *  - React state (hydration stays clean)
   *  - Service Worker
   *  - Current scroll position (no white flash on mobile)
   */
  const switchTo = useCallback((targetLocale: string) => {
    if (transitioning || targetLocale === locale) return;
    setTransitioning(true);
    setCookie("NEXT_LOCALE", targetLocale);

    // Strip current locale prefix from pathname
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0 && LOCALE_CODES.includes(segments[0])) {
      segments.shift();
    }
    const cleanPath = "/" + segments.join("/");
    const targetPath =
      targetLocale === "en" ? cleanPath : `/${targetLocale}${cleanPath}`;

    // Use router.push for soft navigation — no full page reload
    router.push(targetPath);
    setOpen(false);
  }, [pathname, locale, router, transitioning]);

  const current = LANGUAGES[locale] || LANGUAGES.en || { flag: "🇬🇧", label: "English" };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={transitioning}
        style={{ color: "#C0C0C0", fontSize: "12px" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "#FFF"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "#C0C0C0"; }}
        className="flex items-center gap-1 whitespace-nowrap"
        aria-label={`Current language: ${current.label}. Click to switch.`}
      >
        <span aria-hidden="true">{current.flag}</span>
        <span>{locale.toUpperCase()}</span>
        {transitioning && <span className="ml-1 animate-spin text-[10px]">⏳</span>}
      </button>

      {open && (
        <>
          {/* Backdrop to catch outside clicks */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            style={{ zIndex: 999, backgroundColor: "#1A1A2E" }}
            className="absolute right-0 mt-2 border border-silver/10 rounded-lg overflow-hidden min-w-[140px] shadow-xl"
            role="menu"
            aria-label="Language selector"
          >
            {Object.entries(LANGUAGES).map(([code, lang]) =>
              code !== locale ? (
                <button
                  key={code}
                  onClick={() => switchTo(code)}
                  disabled={transitioning}
                  role="menuitem"
                  style={{ color: "#C0C0C0" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#FFF"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#C0C0C0"; e.currentTarget.style.background = "transparent"; }}
                  className="w-full px-4 py-2 text-left text-sm flex gap-2 transition-colors duration-150"
                >
                  <span aria-hidden="true">{lang.flag}</span> {lang.label}
                </button>
              ) : null
            )}
          </div>
        </>
      )}
    </div>
  );
}
