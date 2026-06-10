"use client";
import { motion } from "framer-motion";
import { ReactNode } from "react";

export default function AnimateSection({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <motion.section id={id}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
      className={className}
    >
      {children}
    </motion.section>
  );
}
