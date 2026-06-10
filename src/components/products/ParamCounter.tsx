"use client";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";

interface ParamCounterProps {
  label: string;
  value: string | number;
  unit: string;
  icon: string;
}

export default function ParamCounter({ label, value, unit, icon }: ParamCounterProps) {
  const isNumeric = typeof value === "number" || /^\d+$/.test(String(value));
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const animated = useRef(false);

  useEffect(() => {
    if (isNumeric) {
      animated.current = true;
      const controls = animate(count, Number(value), { duration: 2, ease: "easeOut" });
      return controls.stop;
    }
  }, [value, isNumeric]);

  return (
    <div className="text-center p-6 bg-deep-blue/30 border border-silver/10 rounded-xl">
      <span className="text-2xl">{icon}</span>
      <div className="mt-3">
        {isNumeric ? (
          <>
            <motion.span className="text-3xl font-light text-ice">{rounded}</motion.span>
            <span className="text-lg text-silver/60 ml-1">{unit}</span>
          </>
        ) : (
          <span className="text-2xl font-light text-ice leading-none">{value}{unit}</span>
        )}
      </div>
      <p className="text-xs text-silver/50 mt-2 uppercase tracking-wider">{label}</p>
    </div>
  );
}
