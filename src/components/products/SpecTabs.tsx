"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
interface SpecTabsProps { tabs: { id: string; label: string; content: string }[]; }
export default function SpecTabs({ tabs }: SpecTabsProps) {
  const [active, setActive] = useState(tabs[0]?.id);
  return (
    <div>
      <div className="flex border-b border-silver/10 mb-6">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActive(tab.id)}
            className={`relative px-6 py-3 text-sm tracking-wider transition-colors ${active === tab.id ? "text-forest" : "text-silver/50 hover:text-silver"}`}>
            {tab.label}
            {active === tab.id && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-forest" />}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
          className="text-sm text-silver/70 leading-relaxed">
          {tabs.find((t) => t.id === active)?.content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
