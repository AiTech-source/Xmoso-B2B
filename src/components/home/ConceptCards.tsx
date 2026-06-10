"use client";
import Section from "@/components/ui/Section";
const concepts = [
  { icon: "⚙️", title: "German Precision", desc: "Every cooling unit is engineered with meticulous attention to temperature stability, humidity control, and silent operation.", eco: "Energy-optimized compressors reduce power consumption by up to 40%" },
  { icon: "🌱", title: "Eco Innovation", desc: "Sustainable materials, natural refrigerants, and smart power management minimize environmental impact.", eco: "100% recyclable packaging · FSC-certified wood" },
  { icon: "🌍", title: "Global Reach", desc: "Trusted by premium hotels, vineyards, and collectors across 30+ countries worldwide.", eco: "Local service partners reduce transportation emissions" },
];
export default function ConceptCards() {
  return (
    <Section className="bg-gradient-to-b from-transparent to-deep-blue/20">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {concepts.map((item, i) => (
          <div key={i} className="bg-deep-blue/30 backdrop-blur-sm border border-silver/10 rounded-xl p-8 hover:border-forest/30 transition-all duration-500">
            <span className="text-3xl">{item.icon}</span>
            <h3 className="text-xl font-medium text-white mt-4 mb-3 tracking-wide">{item.title}</h3>
            <p className="text-silver/60 text-sm leading-relaxed">{item.desc}</p>
            <div className="mt-4 pt-4 border-t border-silver/10"><p className="text-forest text-xs tracking-wider">{item.eco}</p></div>
          </div>
        ))}
      </div>
    </Section>
  );
}
