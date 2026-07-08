"use client";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className = "", hover = true }: CardProps) {
  return (
    <div
      className={`bg-deep-blue/50 backdrop-blur-sm border border-silver/10 rounded-lg p-6 transition-all duration-300 ${
        hover ? "hover:-translate-y-1.5 hover:scale-[1.01]" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
