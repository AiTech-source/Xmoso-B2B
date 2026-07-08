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
        <div className="space-y-5 animate-fade-in">
          <h1
            style={{ fontSize: `${line1Size}px`, letterSpacing: "0.08em" }}
            className="font-light text-white leading-tight"
          >
            {line1}
          </h1>
          <h2
            style={{ fontSize: `${line2Size}px`, letterSpacing: "0.10em" }}
            className="font-light text-forest leading-tight"
          >
            {line2}
          </h2>
        </div>
      </div>
    </section>
  );
}
