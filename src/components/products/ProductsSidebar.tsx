"use client";
import { useEffect, useState, useRef } from "react";
import { typeAnchor } from "@/lib/products-by-type";

interface TypeGroup {
  name: string;
  sort_order: number;
  categories: Array<{
    id: string;
    name: string;
    products: any[];
    sort_order: number;
  }>;
}

export default function ProductsSidebar({ typeGroups }: { typeGroups: TypeGroup[] }) {
  const [activeType, setActiveType] = useState("");
  const [activeCat, setActiveCat] = useState("");
  const initialized = useRef(false);

  // Track which section is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            // Check if it's a category anchor (t-xxx-c-xxx) or type anchor
            if (id.startsWith("t-") && id.includes("-c-")) {
              setActiveCat(id);
              setActiveType(id.replace(/-c-\S+$/, ""));
            } else {
              setActiveType(id);
              setActiveCat("");
            }
          }
        }
      },
      { rootMargin: "-90px 0px -60% 0px" },
    );

    const allIds: string[] = [];
    typeGroups.forEach((g) => {
      allIds.push(typeAnchor(g.name));
      g.categories.forEach((c) => {
        if (g.categories.length > 1) allIds.push(typeAnchor(g.name) + "-c-" + c.id);
      });
    });

    const elements = allIds.map((id) => document.getElementById(id)).filter(Boolean);
    elements.forEach((el) => el && observer.observe(el));

    // Set initial active
    if (!initialized.current && typeGroups.length > 0) {
      setActiveType(typeAnchor(typeGroups[0].name));
      initialized.current = true;
    }

    return () => observer.disconnect();
  }, [typeGroups]);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  if (typeGroups.length === 0) return null;

  return (
    <nav className="w-52 shrink-0">
      <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto space-y-0.5 pr-1">
        <p className="text-xs uppercase tracking-widest text-silver/40 mb-3 pb-2 border-b border-silver/10">
          Product Types
        </p>
        {typeGroups.map((g) => {
          const typeId = typeAnchor(g.name);
          const isActiveType = activeType === typeId;
          const catCount = g.categories.length;
          const prodCount = g.categories.reduce((s, c) => s + c.products.length, 0);

          return (
            <div key={g.name} className="mb-2">
              {/* Type link */}
              <a
                href={`#${typeId}`}
                onClick={(e) => { e.preventDefault(); scrollTo(typeId); }}
                className={`flex items-center justify-between text-sm py-1.5 px-2 rounded-lg transition-all ${
                  isActiveType
                    ? "text-forest bg-forest/8 font-medium"
                    : "text-silver/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{g.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isActiveType ? "bg-forest/15 text-forest" : "bg-silver/8 text-silver/40"
                }`}>{prodCount}</span>
              </a>

              {/* Category sub-links */}
              {catCount > 1 && (
                <div className="ml-2 mt-0.5 space-y-0.5 border-l border-silver/10 pl-2">
                  {g.categories.map((c) => {
                    const catId = typeId + "-c-" + c.id;
                    const isActiveCat = activeCat === catId;
                    return (
                      <a
                        key={c.id}
                        href={`#${catId}`}
                        onClick={(e) => { e.preventDefault(); scrollTo(catId); }}
                        className={`block text-xs py-1 px-2 rounded transition-all ${
                          isActiveCat
                            ? "text-ice bg-ice/8 font-medium"
                            : "text-silver/40 hover:text-silver/70 hover:bg-white/5"
                        }`}
                      >
                        — {c.name}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
