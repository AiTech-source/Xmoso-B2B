"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export default function FaqAccordion({ faqs, title }: { faqs: FaqItem[]; title?: string }) {
  const [open, setOpen] = useState<string | null>(null);

  if (!faqs || faqs.length === 0) return null;

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
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-silver/40 text-lg flex-shrink-0"
                >
                  ▾
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
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
