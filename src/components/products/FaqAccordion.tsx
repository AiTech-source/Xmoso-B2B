"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

// Hardcoded fallback — shown when API is unreachable or DB empty
const FALLBACK_FAQS: Record<string, { question: string; answer: string }[]> = {
  wine: [
    { question: "What is the minimum order quantity (MOQ) for this product?", answer: "Our standard MOQ is 50–100 units per model for OEM orders. Sample orders of 1–5 units available." },
    { question: "What certifications do your products have?", answer: "CE, RoHS, ERP for EU; ETL/UL for North America; ISO9001 quality management." },
    { question: "Do you offer OEM/ODM services?", answer: "Yes — full OEM/ODM: custom logo, RAL/Pantone colors, packaging, temperature config." },
    { question: "What temperature range does this wine cooler support?", answer: "5°C–22°C (41°F–72°F). Dual-zone models allow independent temperature control." },
    { question: "Compressor vs thermoelectric — which is better?", answer: "For commercial use: compressor. It handles higher ambient temps and larger capacities (up to 320+ bottles). Thermoelectric is quieter, suited for small residential use." },
    { question: "How long does shipping take?", answer: "25–40 days production. 15–25 days to NA, 20–30 days to Europe by sea. Air freight available." },
  ],
  cigar: [
    { question: "What is the minimum order quantity (MOQ)?", answer: "Standard MOQ 50–100 units. Sample orders of 1–5 units available." },
    { question: "What certifications do your products have?", answer: "CE, RoHS, ERP, ETL/UL, ISO9001." },
    { question: "Do you offer OEM/ODM services?", answer: "Yes — full customization including Spanish cedar interiors, finishes, branding." },
    { question: "What type of wood is used for the cabinet interior?", answer: "Spanish cedar — the industry standard for humidity regulation and cigar aging." },
    { question: "What humidity levels does this cabinet maintain?", answer: "54°F–74°F temperature, 65%–75% RH humidity." },
    { question: "How long does shipping take?", answer: "25–40 days production. 15–25 days to NA, 20–30 days to Europe by sea." },
  ],
  beverage: [
    { question: "What is the minimum order quantity (MOQ)?", answer: "Standard MOQ 50–100 units. Sample orders available." },
    { question: "What certifications do your products have?", answer: "CE, RoHS, ERP, ETL/UL, ISO9001." },
    { question: "Do you offer OEM/ODM services?", answer: "Yes — full customization." },
    { question: "What temperature range does this beverage cooler support?", answer: "2°C–18°C (35°F–65°F). Digital thermostat for precise control." },
    { question: "Built-in or freestanding installation?", answer: "Many models support both. Built-in models feature front-ventilation." },
    { question: "How long does shipping take?", answer: "25–40 days production. 15–25 days to NA, 20–30 days to Europe by sea." },
  ],
  bar: [
    { question: "What is the minimum order quantity (MOQ)?", answer: "Standard MOQ 50–100 units. Sample orders of 1–5 units available." },
    { question: "What certifications do your products have?", answer: "CE, RoHS, ERP, ETL/UL, ISO9001." },
    { question: "Do you offer OEM/ODM services?", answer: "Yes — full OEM/ODM: custom logo, RAL/Pantone colors, packaging." },
    { question: "What materials and finishes are available?", answer: "Solid wood, engineered wood veneers, stainless steel, tempered glass. Custom RAL colors available." },
    { question: "Can bar cabinets be customized for hotel projects?", answer: "Yes — dimensions, finishes, refrigeration, lockable doors, LED lighting." },
    { question: "How long does shipping take?", answer: "25–40 days production. 15–25 days to NA, 20–30 days to Europe by sea." },
  ],
  generic: [
    { question: "What is the minimum order quantity (MOQ)?", answer: "Standard MOQ 50–100 units per model. Sample orders of 1–5 units available." },
    { question: "What certifications do your products have?", answer: "CE, RoHS, ERP, ETL/UL, ISO9001." },
    { question: "Do you offer OEM/ODM services?", answer: "Yes — full OEM/ODM including custom logo, colors, packaging, and labeling." },
    { question: "What is the warranty period?", answer: "1–2 year warranty. Extended options for bulk orders." },
    { question: "What payment terms do you accept?", answer: "T/T, L/C. Typical: 30% deposit, 70% before shipment." },
    { question: "How long does shipping take?", answer: "25–40 days production. 15–25 days to NA, 20–30 days to Europe by sea." },
  ],
};

function getFallbackFaqs(productType: string): { id: string; question: string; answer: string }[] {
  const type = (productType || "").toLowerCase();
  const key =
    type.includes("cigar") || type.includes("humid") ? "cigar" :
    type.includes("wine") ? "wine" :
    type.includes("beverage") || type.includes("drink") ? "beverage" :
    type.includes("bar") || type.includes("cabinet") || type.includes("liquor") ? "bar" :
    "generic";
  return (FALLBACK_FAQS[key] || FALLBACK_FAQS.generic).map((f, i) => ({ ...f, id: `fb-${key}-${i}` }));
}

export default function FaqAccordion({ locale, productType, title }: { locale: string; productType?: string | null; title?: string }) {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ locale });
    if (productType) params.set("product_type", productType);
    fetch(`/api/faqs?${params}`)
      .then((r) => r.json())
      .then((data) => {
        const items: FaqItem[] = (data.faqs || []).map((f: any) => ({ id: f.id, question: f.question, answer: f.answer }));
        if (items.length > 0) {
          setFaqs(items);
        } else {
          setFaqs(getFallbackFaqs(productType || ""));
        }
        setLoading(false);
      })
      .catch(() => {
        setFaqs(getFallbackFaqs(productType || ""));
        setLoading(false);
      });
  }, [locale, productType]);

  if (loading || faqs.length === 0) return null;

  return (
    <div>
      {title && <h3 className="text-xl text-white tracking-wide mb-6">{title}</h3>}
      <div className="space-y-3">
        {faqs.map((faq) => {
          const isOpen = open === faq.id;
          return (
            <div key={faq.id} className="border border-silver/10 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? null : faq.id)}
                className="w-full flex items-center justify-between px-6 py-4 text-left bg-deep-blue/20 hover:bg-deep-blue/40 transition-colors"
              >
                <span className="text-white text-sm font-medium pr-4">{faq.question}</span>
                <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-silver/40 text-lg flex-shrink-0">▾</motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div key="answer" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: "easeInOut" }} className="overflow-hidden">
                    <div className="px-6 py-4 bg-deep-dark/30 border-t border-silver/10">
                      <p className="text-silver/60 text-sm leading-relaxed">{faq.answer}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
