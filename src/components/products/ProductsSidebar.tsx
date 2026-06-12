"use client";
import { useEffect, useState, useRef, useCallback } from "react";
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
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <nav className="w-10 shrink-0 max-md:hidden">
        <div className="sticky top-24 flex flex-col items-center pt-1 gap-1">
          <button
            onClick={() => setCollapsed(false)}
            className="text-silver/40 hover:text-forest transition-colors py-2 text-sm"
            title="Expand sidebar"
          >
            ☰
          </button>
          {typeGroups.map((g) => {
            const typeId = typeAnchor(g.name);
            const isActiveType = activeType === typeId;
            return (
              <button
                key={g.name}
                onClick={() => onScrollTo(typeId)}
                title={g.name}
                className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-medium transition-all ${
                  isActiveType
                    ? "text-forest bg-forest/12"
                    : "text-silver/30 hover:text-silver/60 hover:bg-white/5"
                }`}
              >
                {g.name.charAt(0).toUpperCase()}
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav className="w-52 shrink-0 max-md:hidden">
      <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto space-y-0.5 pr-1
        [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-silver/10">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-silver/10">
          <p className="text-[11px] uppercase tracking-[0.15em] text-silver/50">Products</p>
          <button onClick={() => setCollapsed(true)}
            className="text-silver/30 hover:text-forest transition-colors text-xs px-1" title="Collapse sidebar">
            ◀
          </button>
        </div>
        {typeGroups.map((g) => {
          const typeId = typeAnchor(g.name);
          const isActiveType = activeType === typeId;
          const catCount = g.categories.length;
          const prodCount = g.categories.reduce((s, c) => s + c.products.length, 0);

          return (
            <div key={g.name} className="mb-1.5">
              <button
                onClick={() => onScrollTo(typeId)}
                className={`w-full flex items-center justify-between text-sm py-1.5 px-2.5 rounded-lg transition-all duration-200 text-left ${
                  isActiveType
                    ? "text-forest bg-forest/8 font-medium shadow-[inset_2px_0_0_0_rgba(139,200,160,0.5)]"
                    : "text-silver/60 hover:text-white hover:bg-white/[0.03]"
                }`}
              >
                <span>{g.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  isActiveType ? "bg-forest/12 text-forest" : "bg-silver/8 text-silver/40"
                }`}>{prodCount}</span>
              </button>

              {catCount > 1 && (
                <div className="ml-3 mt-0.5 space-y-[1px] border-l border-silver/10 pl-2.5">
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
                            : "text-silver/50 hover:text-silver/80"
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
const THRESHOLD = 0.25;

function MobileDrawer({ typeGroups, activeType, activeCat, onScrollTo }: {
  typeGroups: TypeGroup[];
  activeType: string;
  activeCat: string;
  onScrollTo: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const dragControls = useDragControls();
  const x = useMotionValue(-DRAWER_WIDTH);

  function openDrawer() {
    setOpen(true);
    animate(x, 0, { type: "spring", stiffness: 400, damping: 35, mass: 0.8 });
  }

  function closeDrawer() {
    setOpen(false);
    animate(x, -DRAWER_WIDTH, { type: "spring", stiffness: 400, damping: 35, mass: 0.8 });
  }

  function handleScrollTo(id: string) {
    onScrollTo(id);
    // sub-menu click: scroll only, DON'T close drawer
    // user closes manually via ✕ or backdrop or drag
  }

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
      {/* Trigger pill — narrow, just the icon */}
      <div className="fixed left-0 top-1/2 -translate-y-1/2 z-40">
        {!open && (
          <motion.button
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            onClick={openDrawer}
            className="flex items-center gap-1 bg-deep-blue/90 backdrop-blur-md border border-l-0 border-silver/15 rounded-r-xl py-3 px-2 text-xs text-silver/60 hover:text-forest hover:border-forest/30 transition-colors shadow-lg cursor-pointer"
          >
            <span className="text-forest text-base leading-none">☰</span>
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
        className="fixed left-0 top-0 bottom-0 z-50 w-[280px] bg-[#0E0E18]/98 backdrop-blur-xl shadow-2xl border-r border-silver/8 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-silver/8">
          <span className="text-sm tracking-[0.2em] text-silver/80 font-light">Product</span>
          <button
            onClick={closeDrawer}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 text-silver/60 hover:text-white hover:bg-white/10 transition-all text-sm cursor-pointer"
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
                      ? "text-forest font-medium bg-forest/6"
                      : "text-white/80 active:text-white"
                  }`}
                >
                  <span>{g.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    isActiveType ? "bg-forest/12 text-forest" : "bg-silver/10 text-silver/50"
                  }`}>{prodCount}</span>
                </button>

                {catCount > 1 && (
                  <div className="ml-4 pl-3 border-l border-silver/10 space-y-[1px]">
                    {g.categories.map((c) => {
                      const catId = typeId + "-c-" + c.id;
                      const isActiveCat = activeCat === catId;
                      return (
                        <button
                          key={c.id}
                          onClick={() => handleScrollTo(catId)}
                          className={`block text-xs py-2 px-3 rounded-lg transition-all duration-200 w-full text-left ${
                            isActiveCat
                              ? "text-ice font-medium bg-ice/8"
                              : "text-white/70 hover:text-white"
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

        {/* Drag hint */}
        <div className="px-5 py-3 border-t border-silver/8 text-center">
          <div className="w-8 h-1 rounded-full bg-silver/15 mx-auto" />
          <p className="text-[10px] text-silver/40 mt-1.5 tracking-wider">↔ drag to close</p>
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

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

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
