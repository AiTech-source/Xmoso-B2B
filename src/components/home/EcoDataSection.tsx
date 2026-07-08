"use client";
import { motion } from "framer-motion";
import Section from "@/components/ui/Section";
const stats = [
  { value: 45, suffix: "%", label: "Energy Saved", color: "text-forest" },
  { value: 2.3, suffix: "T", label: "CO₂ Reduced", color: "text-ice" },
  { value: 15000, suffix: "+", label: "Units Eco-Certified", color: "text-forest" },
];
export default function EcoDataSection() {
  return (
    <Section>
      <div className="max-w-6xl mx-auto text-center">
        <h3 className="text-2xl md:text-3xl font-light tracking-wider text-white mb-4">Our <span className="text-forest">Sustainability</span> Impact</h3>
        <p className="text-silver/60 text-sm mb-12 max-w-xl mx-auto">Every DeepCool cabinet is designed with the planet in mind.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.2, duration: 0.6 }} className="flex flex-col items-center">
              <div className="relative w-32 h-32 rounded-full border-2 border-forest/30 flex items-center justify-center mb-4">
                <motion.span initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className={`text-3xl font-light ${stat.color}`}>{stat.value}{stat.suffix}</motion.span>
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 128 128">
                  <circle cx="64" cy="64" r="58" fill="none" stroke="currentColor" className="text-forest/20" strokeWidth="4" />
                  <motion.circle cx="64" cy="64" r="58" fill="none" stroke="currentColor" className="text-forest" strokeWidth="4" strokeLinecap="round" strokeDasharray="364"
                    initial={{ strokeDashoffset: 364 }}
                    whileInView={{ strokeDashoffset: 364 * (1 - (i + 1) * 0.25) }}
                    viewport={{ once: true }} transition={{ duration: 1.5, delay: i * 0.3 }} />
                </svg>
              </div>
              <p className="text-silver/80 text-sm tracking-wider">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}
