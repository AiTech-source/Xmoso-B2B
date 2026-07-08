interface BadgeProps {
  children: string;
  variant?: "eco" | "tech" | "default";
}

export default function Badge({ children, variant = "default" }: BadgeProps) {
  const variants = {
    eco: "bg-forest/20 text-forest border border-forest/30",
    tech: "bg-ice/20 text-ice border border-ice/30",
    default: "bg-silver/10 text-silver border border-silver/20",
  };
  return (
    <span className={`inline-block px-3 py-1 text-xs font-medium tracking-wider rounded-full ${variants[variant]}`}>
      {children}
    </span>
  );
}
