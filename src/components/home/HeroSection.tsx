"use client";
import { motion } from "framer-motion";

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.3 } },
} as const;
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } },
};

interface HeroSectionProps {
  line1: string;
  line2: string;
  line1Size?: number;
  line2Size?: number;
}

export default function HeroSection({ line1, line2, line1Size = 30, line2Size = 24 }: HeroSectionProps) {
  return (
    <section className="relative min-h-[50vh] md:min-h-[60vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0" />
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-5">
          <motion.h1 variants={fadeUp}
            style={{ fontSize: `${line1Size}px`, letterSpacing: "0.08em" }}
            className="font-light text-white leading-tight">
            {line1}
          </motion.h1>
          <motion.h2 variants={fadeUp}
            style={{ fontSize: `${line2Size}px`, letterSpacing: "0.10em" }}
            className="font-light text-forest leading-tight">
            {line2}
          </motion.h2>
        </motion.div>
      </div>
    </section>
  );
}
