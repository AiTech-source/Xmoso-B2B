"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Static FAQ data — fallback if no server data provided
const FALLBACK_FAQS: Record<string, { question: string; answer: string }[]> = {
  "en": [
    { question: "What is the minimum order quantity (MOQ)?", answer: "Standard MOQ 50-100 units per model. Sample orders of 1-5 units available for quality evaluation before bulk commitment." },
    { question: "What certifications do your products have?", answer: "CE, RoHS, ERP for European markets; ETL/UL for North America. ISO9001 quality management across our production facilities." },
    { question: "Do you offer OEM/ODM services?", answer: "Yes — full OEM/ODM services: custom logo printing, RAL/Pantone color matching, custom packaging design, temperature zone configuration, and multilingual labeling." },
    { question: "How long does shipping take?", answer: "Production lead time is 25-40 days after deposit confirmation. Shipping: 15-25 days to North America, 20-30 days to Europe by sea. Air freight available." },
  ],
  "zh": [
    { question: "最低起订量（MOQ）是多少？", answer: "OEM 标准起订量为每款 50-100 台。可提供 1-5 台样品订单供质量评估。" },
    { question: "有哪些认证？", answer: "CE、RoHS、ERP（欧洲）、ETL/UL（北美）、ISO9001。" },
    { question: "提供 OEM/ODM 服务吗？", answer: "是的，包含 Logo、配色、包装、温区配置、多语言标签等。" },
    { question: "运输时间多久？", answer: "生产 25-40 天。海运到北美 15-25 天，到欧洲 20-30 天。" },
  ],
};

interface FaqItem {
  id?: string;
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  locale: string;
  productType?: string | null;
  title?: string;
  /** Server-fetched FAQs from Supabase product_faqs table */
  faqs?: FaqItem[];
}

export default function FaqAccordion({ locale, productType, title, faqs }: FaqAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  // Use server FAQs if provided, otherwise fallback to hardcoded data
  const items: FaqItem[] = faqs && faqs.length > 0
    ? faqs
    : FALLBACK_FAQS[locale === "zh" ? "zh" : "en"] || FALLBACK_FAQS.en;

  if (!items.length) return null;

  return (
    <div>
      {title && <h3 className="text-xl text-white tracking-wide mb-6">{title}</h3>}
      <div className="space-y-3">
        {items.map((faq, i) => {
          const id = faq.id || `faq-${i}`;
          return (
            <div key={id} className="border border-silver/10 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenId(openId === id ? null : id)}
                className="w-full flex items-center justify-between px-6 py-4 text-left bg-deep-blue/20 hover:bg-deep-blue/40 transition-colors"
              >
                <span className="text-white text-sm font-medium pr-4">{faq.question}</span>
                <motion.span animate={{ rotate: openId === id ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-silver/40 text-lg flex-shrink-0">▾</motion.span>
              </button>
              <AnimatePresence>
                {openId === id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
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
