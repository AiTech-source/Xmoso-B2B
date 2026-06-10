"use client";
import Section from "@/components/ui/Section";
const certs = [
  { name: "Energy Star", icon: "⭐" }, { name: "FSC Certified", icon: "🌲" },
  { name: "RoHS Compliant", icon: "🔋" }, { name: "CE Marked", icon: "✅" }, { name: "ISO 14001", icon: "♻️" },
];
export default function Certifications() {
  return (
    <Section className="bg-deep-blue/10">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-xs text-silver/40 uppercase tracking-[0.2em] mb-6">Certifications & Compliance</p>
        <div className="flex flex-wrap justify-center gap-6">
          {certs.map((cert) => (
            <div key={cert.name} className="flex items-center gap-2 px-4 py-2 bg-deep-blue/30 border border-silver/10 rounded-full">
              <span>{cert.icon}</span><span className="text-sm text-silver/70 tracking-wide">{cert.name}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
