"use client";
import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}

export default function Button({
  children, variant = "primary", size = "md", onClick, className = "", type = "button", disabled,
}: ButtonProps) {
  const base = "inline-flex items-center justify-center font-medium tracking-wider transition-all duration-300 border cursor-pointer";
  const sizes = { sm: "px-4 py-2 text-sm", md: "px-6 py-3 text-base", lg: "px-8 py-4 text-lg" };
  const variants = {
    primary: "bg-forest text-deep-dark border-forest hover:bg-transparent hover:text-forest",
    outline: "bg-transparent text-silver border-silver/30 hover:border-silver hover:text-white",
    ghost: "bg-transparent text-silver border-transparent hover:text-white",
  };
  return (
    <button
      type={type === "submit" ? "submit" : "button"}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
