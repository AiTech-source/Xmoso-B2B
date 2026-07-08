"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SpecRow {
  no?: number;
  label: string;
  value: string;
  bgColor?: string;
  fontSize?: string;
  color?: string;
}

interface SpecTableProps {
  specs: SpecRow[];
  initialRows?: number;
}

export default function SpecTable({ specs, initialRows = 16 }: SpecTableProps) {
  const [expanded, setExpanded] = useState(false);
  if (!specs || specs.length === 0) return null;

  const showToggle = specs.length > initialRows;
  const visibleSpecs = expanded ? specs : specs.slice(0, initialRows);

  return (
    <div className="overflow-hidden rounded-xl border border-silver/10">
      <table className="w-full">
        <thead>
          <tr className="bg-deep-blue/40 text-silver/40 text-[10px] uppercase tracking-[0.15em]">
            <th className="px-3 py-2 text-center w-10 font-normal">No.</th>
            <th className="px-3 py-2 text-left font-normal">Specification</th>
            <th className="px-3 py-2 text-left font-normal">Value</th>
          </tr>
        </thead>
        <tbody>
          {visibleSpecs.map((spec, i) => (
            <tr
              key={i}
              className={`border-t border-silver/5 ${spec.bgColor ? "" : i % 2 === 0 ? "bg-row-even" : "bg-row-odd"}`}
              style={spec.bgColor ? { backgroundColor: spec.bgColor } : undefined}
            >
              <td className="px-3 py-1.5 text-center text-silver/40 text-[11px] leading-tight">
                {spec.no || i + 1}
              </td>
              <td
                className="px-3 py-1.5 text-[11px] leading-tight text-silver/80"
                style={{
                  fontSize: spec.fontSize ? `${spec.fontSize}px` : undefined,
                  fontWeight: spec.fontSize ? undefined : 300,
                  color: spec.color || undefined,
                }}
              >
                {spec.label}
              </td>
              <td
                className="px-3 py-1.5 text-[11px] leading-tight"
                style={{
                  fontSize: spec.fontSize ? `${spec.fontSize}px` : undefined,
                  fontWeight: spec.fontSize ? undefined : 300,
                  color: spec.color || undefined,
                }}
              >
                {spec.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Toggle button */}
      {showToggle && (
        <div className="border-t border-silver/10">
          <AnimatePresence mode="wait">
            <motion.button
              key={expanded ? "less" : "more"}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2 }}
              onClick={() => setExpanded(!expanded)}
              className="w-full py-3 text-xs tracking-wider text-ice/60 hover:text-ice/90 hover:bg-ice/5 transition-all flex items-center justify-center gap-2"
            >
              {expanded ? (
                <>▲ Show Less <span className="text-silver/30">({specs.length} total)</span></>
              ) : (
                <>▼ View All {specs.length} Specifications</>
              )}
            </motion.button>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
