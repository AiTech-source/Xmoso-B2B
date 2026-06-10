"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
}

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const switchTo = (targetLocale: string) => {
    // Save locale choice to cookie so middleware respects it
    setCookie("NEXT_LOCALE", targetLocale);

    // Strip current locale prefix from pathname
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0 && ["en", "zh"].includes(segments[0])) {
      segments.shift();
    }
    const cleanPath = "/" + segments.join("/");
    // With "as-needed": EN = no prefix, ZH = /zh prefix
    const target = targetLocale === "en" ? cleanPath : `/zh${cleanPath === "/" ? "" : cleanPath}`;
    window.location.href = target;
    setOpen(false);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 text-sm text-silver hover:text-white transition-colors">
        <span>{locale === "en" ? "🇬🇧" : "🇨🇳"}</span>
        <span>{locale.toUpperCase()}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="absolute right-0 mt-2 bg-deep-blue border border-silver/10 rounded-lg overflow-hidden min-w-[120px]" style={{ zIndex: 999 }}>
            {locale !== "en" && <button onClick={() => switchTo("en")} className="w-full px-4 py-2 text-left text-sm text-silver hover:text-white hover:bg-white/5 flex gap-2">🇬🇧 English</button>}
            {locale !== "zh" && <button onClick={() => switchTo("zh")} className="w-full px-4 py-2 text-left text-sm text-silver hover:text-white hover:bg-white/5 flex gap-2">🇨🇳 中文</button>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
