"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Static FAQ data — no API calls, works reliably in all environments
const FAQS: Record<string, { question: string; answer: string }[]> = {
  "en-bar": [
    { question: "What is the minimum order quantity (MOQ)?", answer: "Standard MOQ 50-100 units per model. Sample orders of 1-5 units available for quality evaluation before bulk commitment." },
    { question: "What certifications do your products have?", answer: "CE, RoHS, ERP for European markets; ETL/UL for North America. ISO9001 quality management across our production facilities." },
    { question: "Do you offer OEM/ODM services?", answer: "Yes — full OEM/ODM services: custom logo printing, RAL/Pantone color matching, custom packaging design, temperature zone configuration, and multilingual labeling." },
    { question: "What materials and finishes are available?", answer: "Solid wood, engineered wood veneers, stainless steel, and tempered glass. Custom RAL colors and Pantone matching available for hospitality projects." },
    { question: "Can bar cabinets be customized for hotel projects?", answer: "Yes — we specialize in custom solutions for hotels and hospitality. Dimensions, finishes, integrated refrigeration, lockable doors, and LED lighting can all be customized." },
    { question: "Can a bar cabinet cooler be built into existing cabinetry?", answer: "Yes — our patented front-bottom self-ventilation system requires no rear clearance for heat dissipation. Flush installation against walls or inside cabinetry." },
    { question: "How long does shipping take?", answer: "Production lead time is 25-40 days after deposit confirmation. Shipping: 15-25 days to North America, 20-30 days to Europe by sea. Air freight available." },
  ],
  "zh-bar": [
    { question: "这款产品的最低起订量（MOQ）是多少？", answer: "OEM 标准起订量为每款 50-100 台。可提供 1-5 台样品订单供质量评估，确认后再批量下单。" },
    { question: "你们的产品有哪些认证？", answer: "CE、RoHS、ERP（欧洲市场）；ETL/UL（北美市场）。生产工厂通过 ISO9001 质量管理体系认证。" },
    { question: "你们提供 OEM/ODM 服务吗？", answer: "是的，提供完整 OEM/ODM 服务：Logo 印刷、RAL/Pantone 颜色匹配、定制包装设计、温区配置和多语言标签。" },
    { question: "有哪些材质和饰面可供选择？", answer: "实木、工程木贴面、不锈钢、钢化玻璃。可定制 RAL 颜色和 Pantone 配色，适用于酒店和商业项目。" },
    { question: "吧台柜可以针对酒店项目定制吗？", answer: "可以 — 我们专为酒店和商业项目提供定制服务。尺寸、材质、饰面、集成制冷、门锁、LED 灯光均可定制。" },
    { question: "恒温餐边柜可以嵌入现有柜体吗？", answer: "可以 — 我们的专利前底部自通风系统无需背部散热空间，可紧贴墙壁或嵌入柜体安装。" },
    { question: "运输时间需要多久？", answer: "确认定金后生产周期 25-40 天。海运到北美 15-25 天，到欧洲 20-30 天。可安排空运。" },
  ],
  "en-wine": [
    { question: "What is the minimum order quantity (MOQ)?", answer: "Standard MOQ 50-100 units per model. Sample orders of 1-5 units available for quality evaluation." },
    { question: "What certifications do your products have?", answer: "CE, RoHS, ERP for European markets; ETL/UL for North America. ISO9001 quality management." },
    { question: "Do you offer OEM/ODM services?", answer: "Yes — full OEM/ODM: custom logo, RAL/Pantone colors, packaging design, temperature config, multilingual labels." },
    { question: "What temperature range does this wine cooler support?", answer: "5-22 degrees C (41-72 degrees F). Dual-zone models allow independent temperature control for different wine varieties." },
    { question: "Compressor vs thermoelectric which is better for commercial use?", answer: "For commercial applications, compressor-based wine coolers are recommended. They provide consistent cooling regardless of ambient temperature and are available in larger capacities (up to 320+ bottles)." },
    { question: "How much ventilation clearance does a wine cooler need?", answer: "Our patented self-ventilation system eliminates the need for rear clearance. Traditional designs typically need 4-6 inches at the back." },
    { question: "How long does shipping take?", answer: "25-40 days production. 15-25 days to North America, 20-30 days to Europe by sea." },
  ],
  "zh-wine": [
    { question: "最低起订量（MOQ）是多少？", answer: "OEM 标准起订量为每款 50-100 台。可提供 1-5 台样品订单。" },
    { question: "有哪些认证？", answer: "CE、RoHS、ERP（欧洲）、ETL/UL（北美）、ISO9001。" },
    { question: "提供 OEM/ODM 服务吗？", answer: "是的，包括 Logo、配色、包装、温区配置、多语言标签等。" },
    { question: "这款酒柜支持什么温度范围？", answer: "5-22度。双温区型号可独立控制不同温度。" },
    { question: "压缩机和热电冷酒柜商用选哪种更好？", answer: "商用建议压缩机制冷。制冷稳定，不受环境温度影响，容量可达 320 瓶以上。" },
    { question: "红酒柜需要多少散热空间？", answer: "我们的自通风专利技术无需背部散热空间。" },
    { question: "运输时间多久？", answer: "生产 25-40 天。海运到北美 15-25 天，到欧洲 20-30 天。" },
  ],
};

function getFaqs(locale: string, productType: string | null | undefined) {
  const t = (productType || "").toLowerCase();
  const key =
    t.includes("cigar") || t.includes("humid") ? "cigar" :
    t.includes("wine") ? "wine" :
    t.includes("beverage") || t.includes("drink") ? "beverage" :
    t.includes("bar") || t.includes("cabinet") || t.includes("liquor") ? "bar" :
    "wine";
  const lang = locale === "zh" ? "zh" : "en";
  // Fallback to wine or en if key not found
  const data = FAQS[lang + "-" + key] || FAQS["en-wine"];
  return data.map((f, i) => ({ ...f, id: "faq-" + i }));
}

export default function FaqAccordion({ locale, productType, title }: { locale: string; productType?: string | null | undefined; title?: string }) {
  const faqs = getFaqs(locale, productType);
  const [open, setOpen] = useState<string | null>(null);
  if (!faqs.length) return null;

  return (
    <div>
      {title && <h3 className="text-xl text-white tracking-wide mb-6">{title}</h3>}
      <div className="space-y-3">
        {faqs.map((faq) => (
          <div key={faq.id} className="border border-silver/10 rounded-xl overflow-hidden">
            <button
              onClick={() => setOpen(open === faq.id ? null : faq.id)}
              className="w-full flex items-center justify-between px-6 py-4 text-left bg-deep-blue/20 hover:bg-deep-blue/40 transition-colors"
            >
              <span className="text-white text-sm font-medium pr-4">{faq.question}</span>
              <motion.span animate={{ rotate: open === faq.id ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-silver/40 text-lg flex-shrink-0">▾</motion.span>
            </button>
            <AnimatePresence>
              {open === faq.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                  <div className="px-6 py-4 bg-deep-dark/30 border-t border-silver/10">
                    <p className="text-silver/60 text-sm leading-relaxed">{faq.answer}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
