"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

const STORAGE_KEY = "compare_slugs";

function readStorage(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const items = raw ? raw.split(",").filter(Boolean) : [];
    // Strict validation: must look like a URL slug (letters, hyphens, length > 2)
    return items.filter((s) => /^[a-z][a-z0-9-]+$/.test(s));
  } catch { return []; }
}

export default function CompareBar() {
  const [slugs, setSlugs] = useState<string[]>([]);
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    setSlugs(readStorage());
    function handler() { setSlugs(readStorage()); }
    window.addEventListener("compare-update", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("compare-update", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  function clearAll() {
    localStorage.removeItem(STORAGE_KEY);
    setSlugs([]);
    window.dispatchEvent(new CustomEvent("compare-update"));
  }

  function goCompare() {
    if (slugs.length < 2) return;
    const qs = slugs.map((s) => encodeURIComponent(s)).join(",");
    router.push(`/${locale}/products/compare?slugs=${qs}`);
  }

  return (
    <div>
      {slugs.length >= 2 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-deep-blue/90 backdrop-blur-lg border-t border-silver/10 shadow-2xl"
          style={{ animation: "slideUp 0.3s ease-out" }}>
          <style>{`@keyframes slideUp{from{transform:translateY(80px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-silver/60">
                <span className="text-forest font-medium">{slugs.length}</span> products selected
              </span>
              <button onClick={clearAll}
                className="text-xs text-silver/40 hover:text-silver/70 transition-colors">Clear all</button>
            </div>
            <button onClick={goCompare}
              className="px-6 py-2 bg-forest text-deep-dark text-sm font-medium rounded-lg hover:bg-forest/90 transition-all flex items-center gap-2">
              📊 Compare
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
