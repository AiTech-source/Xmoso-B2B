"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";

const STORAGE_KEY = "compare_slugs";

export default function CompareBar() {
  const [slugs, setSlugs] = useState<string[]>([]);
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();

  // Clear compare when visiting the homepage (any locale)
  useEffect(() => {
    const isHome = pathname === "/" || pathname === `/${locale}` || pathname === `/${locale}/`;
    if (isHome) {
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      setSlugs([]);
      window.dispatchEvent(new CustomEvent("compare-update"));
      return;
    }
    // Otherwise read current selection
    function update() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        setSlugs(raw ? raw.split(",").filter(Boolean) : []);
      } catch { setSlugs([]); }
    }
    update();
  }, [pathname, locale]);

  // Listen for updates from other components
  useEffect(() => {
    if (pathname === "/" || pathname === `/${locale}` || pathname === `/${locale}/`) return;
    function update() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        setSlugs(raw ? raw.split(",").filter(Boolean) : []);
      } catch { setSlugs([]); }
    }
    window.addEventListener("compare-update", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("compare-update", update);
      window.removeEventListener("storage", update);
    };
  }, [pathname, locale]);

  function clearAll() {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setSlugs([]);
    window.dispatchEvent(new CustomEvent("compare-update"));
  }

  function goCompare() {
    if (slugs.length < 2) return;
    const qs = slugs.map((s) => encodeURIComponent(s)).join(",");
    router.push(`/${locale}/products/compare?slugs=${qs}`);
  }

  return (
    <AnimatePresence>
      {slugs.length >= 2 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-deep-blue/90 backdrop-blur-lg border-t border-silver/10 shadow-2xl"
        >
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-silver/60">
                <span className="text-forest font-medium">{slugs.length}</span> products selected
              </span>
              <button onClick={clearAll}
                className="text-xs text-silver/40 hover:text-silver/70 transition-colors">
                Clear all
              </button>
            </div>
            <button onClick={goCompare}
              className="px-6 py-2 bg-forest text-deep-dark text-sm font-medium rounded-lg hover:bg-forest/90 transition-all flex items-center gap-2">
              📊 Compare
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
