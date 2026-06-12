"use client";
import { useEffect, useState, useRef } from "react";
import { motion, useDragControls, useMotionValue, animate, useTransform } from "framer-motion";
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

// ─── Desktop Sidebar ───

function DesktopSidebar({ typeGroups, activeType, activeCat, onScrollTo }: {
  typeGroups: TypeGroup[];
  activeType: string;
  activeCat: string;
  onScrollTo: (id: string) => void;
}) {
  return (
    <nav className="w-52 shrink-0 hidden md:block">
      <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto space-y-0.5 pr-1
        [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-silver/10">
        <p className="text-[11px] uppercase tracking-[0.15em] text-silver/40 mb-3 pb-2 border-b border-silver/10">
          Products
        </p>
        {typeGroups.map((g) => {
          const typeId = typeAnchor(g.name);
          const isActiveType = activeType === typeId;
          const catCount = g.categories.length;
          const prodCount = g.categories.reduce((s, c) => s + c.products.length, 0);

          return (
            <div key={g.name} className="mb-1.5">
              {/* Type link */}
              <button
                onClick={() => onScrollTo(typeId)}
                className={`w-full flex items-center justify-between text-sm py-1.5 px-2.5 rounded-lg transition-all duration-200 text-left ${
                  isActiveType
                    ? "text-forest bg-forest/8 font-medium shadow-[inset_2px_0_0_0_rgba(139,200,160,0.5)]"
                    : "text-silver/50 hover:text-white hover:bg-white/[0.03]"
                }`}
              >
                <span>{g.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  isActiveType ? "bg-forest/12 text-forest" : "bg-silver/8 text-silver/35"
                }`}>{prodCount}</span>
              </button>

              {/* Category sub-links */}
              {catCount > 1 && (
                <div className="ml-3 mt-0.5 space-y-[1px] border-l border-silver/8 pl-2.5">
                  {g.categories.map((c) => {
                    const catId = typeId + "-c-" + c.id;
                    const isActiveCat = activeCat === catId;
                    return (
                      <button
                        key={c.id}
                        onClick={() => onScrollTo(catId)}
                        className={`block text-xs py-1 px-2 rounded-md transition-all duration-200 w-full text-left ${
                          isActiveCat
                            ? "text-ice font-medium bg-ice/6"
                            : "text-silver/40 hover:text-silver/70"
                        }`}
                      >
                        {c.name}
                      </button>
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

// ─── Mobile Drawer ───

const DRAWER_WIDTH = 280;
const THRESHOLD = 0.25; // 25% of drawer width = snap threshold

function MobileDrawer({ typeGroups, activeType, activeCat, onScrollTo }: {
  typeGroups: TypeGroup[];
  activeType: string;
  activeCat: string;
  onScrollTo: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const dragControls = useDragControls();
  const x = useMotionValue(-DRAWER_WIDTH);
  const overlayOpacity = useTransform(x, [-DRAWER_WIDTH, 0], [0, 0.6]);

  // Open / close with spring
  function openDrawer() {
    setOpen(true);
    animate(x, 0, { type: "spring", stiffness: 400, damping: 35, mass: 0.8 });
  }

  function closeDrawer() {
    setOpen(false);
    animate(x, -DRAWER_WIDTH, { type: "spring", stiffness: 400, damping: 35, mass: 0.8 });
  }

  function handleScrollTo(id: string) {
    closeDrawer();
    // Tiny delay so the drawer closes before scroll
    setTimeout(() => onScrollTo(id), 150);
  }

  // Handle drag end with threshold
  function handleDragEnd(_: any, info: any) {
    const threshold = DRAWER_WIDTH * THRESHOLD;
    if (info.offset.x < -threshold || info.velocity.x < -300) {
      closeDrawer();
    } else {
      animate(x, 0, { type: "spring", stiffness: 400, damping: 35, mass: 0.8 });
    }
  }

  return (
    <div className="md:hidden">
      {/* Trigger pill — sits on the left edge */}
      <div className="fixed left-0 top-1/2 -translate-y-1/2 z-40">
        {!open && (
          <motion.button
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            onClick={openDrawer}
            className="flex items-center gap-1.5 bg-deep-blue/90 backdrop-blur-md border border-l-0 border-silver/15 rounded-r-xl py-3 px-3 text-xs text-silver/60 hover:text-forest hover:border-forest/30 transition-colors shadow-lg cursor-pointer"
            style={{ writingMode: "horizontal-tb" }}
          >
            <span className="text-forest text-sm">☰</span>
            <span className="tracking-wider">Product</span>
          </motion.button>
        )}
      </div>

      {/* Overlay backdrop */}
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={closeDrawer}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        />
      )}

      {/* Drawer */}
      <motion.nav
        style={{ x }}
        drag="x"
        dragControls={dragControls}
        dragConstraints={{ left: -DRAWER_WIDTH, right: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        className="fixed left-0 top-0 bottom-0 z-50 w-[280px] bg-deep-blue/95 backdrop-blur-xl shadow-2xl border-r border-silver/10 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-silver/8">
          <span className="text-sm tracking-[0.2em] text-white font-light">Product</span>
          <button
            onClick={closeDrawer}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 text-silver/50 hover:text-white hover:bg-white/10 transition-all text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1
          [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-silver/10">
          {typeGroups.map((g) => {
            const typeId = typeAnchor(g.name);
            const isActiveType = activeType === typeId;
            const catCount = g.categories.length;
            const prodCount = g.categories.reduce((s, c) => s + c.products.length, 0);

            return (
              <div key={g.name} className="mb-1">
                <button
                  onClick={() => handleScrollTo(typeId)}
                  className={`w-full flex items-center justify-between text-sm py-2.5 px-3 rounded-xl transition-all duration-200 text-left ${
                    isActiveType
                      ? "text-forest bg-forest/8 font-medium"
                      : "text-silver/60 active:text-white"
                  }`}
                >
                  <span>{g.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    isActiveType ? "bg-forest/12 text-forest" : "bg-silver/8 text-silver/40"
                  }`}>{prodCount}</span>
                </button>

                {catCount > 1 && (
                  <div className="ml-4 pl-3 border-l border-silver/8 space-y-[1px]">
                    {g.categories.map((c) => {
                      const catId = typeId + "-c-" + c.id;
                      const isActiveCat = activeCat === catId;
                      return (
                        <button
                          key={c.id}
                          onClick={() => handleScrollTo(catId)}
                          className={`block text-xs py-2 px-3 rounded-lg transition-all duration-200 w-full text-left ${
                            isActiveCat
                              ? "text-ice font-medium bg-ice/6"
                              : "text-silver/40 active:text-silver/70"
                          }`}
                        >
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Drag hint at bottom */}
        <div className="px-5 py-3 border-t border-silver/8 text-center">
          <div className="w-8 h-1 rounded-full bg-silver/20 mx-auto" />
          <p className="text-[10px] text-silver/30 mt-1.5 tracking-wider">↔ drag to close</p>
        </div>
      </motion.nav>
    </div>
  );
}

// ─── Main Component ───

export default function ProductsSidebar({ typeGroups }: { typeGroups: TypeGroup[] }) {
  const [activeType, setActiveType] = useState("");
  const [activeCat, setActiveCat] = useState("");
  const initialized = useRef(false);

  // IntersectionObserver for desktop + mobile
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            if (id.includes("-c-")) {
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

    if (!initialized.current && typeGroups.length > 0) {
      setActiveType(typeAnchor(typeGroups[0].name));
      initialized.current = true;
    }

    return () => observer.disconnect();
  }, [typeGroups]);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (typeGroups.length === 0) return null;

  return (
    <>
      <DesktopSidebar
        typeGroups={typeGroups}
        activeType={activeType}
        activeCat={activeCat}
        onScrollTo={scrollTo}
      />
      <MobileDrawer
        typeGroups={typeGroups}
        activeType={activeType}
        activeCat={activeCat}
        onScrollTo={scrollTo}
      />
    </>
  );
}
