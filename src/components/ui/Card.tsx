"use client";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className = "", hover = true }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -6, scale: 1.01 } : undefined}
      className={`bg-deep-blue/50 backdrop-blur-sm border border-silver/10 rounded-lg p-6 ${className}`}
    >
      {children}
    </motion.div>
  );
}
