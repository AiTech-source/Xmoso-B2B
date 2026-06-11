"use client";
import { useEffect, useState, useRef } from "react";
import { typeAnchor } from "@/lib/products-by-type";

interface TypeGroup {
  name: string;
  sort_order: number;
  categories: any[];
}

export default function ProductsSidebar({ typeGroups }: { typeGroups: TypeGroup[] }) {
  const [active, setActive] = useState("");
  const initialized = useRef(false);

  // Track which section is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: "-88px 0px -65% 0px" },
    );

    const ids = typeGroups.map((g) => typeAnchor(g.name));
    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean);
    elements.forEach((el) => el && observer.observe(el));

    // Set initial active
    if (!initialized.current && ids.length > 0) {
      setActive(ids[0]);
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

  return (
    <nav className="hidden lg:block w-48 shrink-0">
      <div className="sticky top-24 space-y-1">
        <p className="text-xs uppercase tracking-widest text-silver/40 mb-4 pb-2 border-b border-silver/10">
          Product Types
        </p>
        {typeGroups.map((g) => {
          const id = typeAnchor(g.name);
          return (
            <a
              key={g.name}
              href={`#${id}`}
              onClick={(e) => {
                e.preventDefault();
                scrollTo(id);
              }}
              className={`block text-sm py-1.5 transition-colors ${
                active === id
                  ? "text-forest border-l-2 border-forest pl-2 font-medium"
                  : "text-silver/50 hover:text-white pl-3"
              }`}
            >
              {g.name}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
