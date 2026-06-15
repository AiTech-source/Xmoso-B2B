"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FloatingInquiryProps {
  locale: string;
  productName?: string;
  productModel?: string;
  productId?: string;
}

export default function FloatingInquiry({ locale, productName, productModel, productId }: FloatingInquiryProps) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const params = new URLSearchParams(window.location.search);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"), email: form.get("email"),
          company: form.get("company"), phone: form.get("phone"), message: form.get("message"),
          product_id: productId || undefined,
          locale, page_url: window.location.pathname,
          utm_source: params.get("utm_source") || "", utm_medium: params.get("utm_medium") || "", utm_campaign: params.get("utm_campaign") || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to send"); setSending(false); return; }
      setSending(false);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Network error");
      setSending(false);
    }
  }

  return (
    <div className="w-full">
      <button onClick={() => { setOpen(true); setSubmitted(false); setError(""); }}
        className="w-full px-6 py-4 rounded-xl bg-forest text-[#0A0A0F] font-semibold tracking-wide hover:bg-forest/90 transition-colors flex items-center justify-center gap-2 shadow-lg text-base">
        <span className="text-lg">✉</span>
        <span>Send Inquiry</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-50 md:w-[520px] bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
                <h3 className="text-[#0A0A0F] font-semibold text-base tracking-wide">📩 Send Inquiry</h3>
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-[#0A0A0F] text-lg leading-none transition-colors">✕</button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto">
                {submitted ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10">
                    <span className="text-5xl">✅</span>
                    <p className="text-forest mt-4 text-sm font-medium">Thank you! We&apos;ll get back to you shortly.</p>
                    <button onClick={() => setOpen(false)} className="mt-5 text-xs text-gray-400 hover:text-[#0A0A0F] transition-colors">Close</button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Product info display */}
                    {(productName || productModel) && (
                      <div className="bg-forest/10 border border-forest/30 rounded-lg px-4 py-3 flex items-center gap-2">
                        <span className="text-forest text-base">📎</span>
                        <div>
                          <span className="text-[#0A0A0F] text-sm font-medium">{productName || productModel}</span>
                          {productModel && productName && (
                            <span className="text-gray-500 text-xs ml-1.5">({productModel})</span>
                          )}
                        </div>
                      </div>
                    )}

                    <input name="name" required placeholder="Name *"
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm text-[#0A0A0F] placeholder-gray-400 focus:border-forest focus:ring-1 focus:ring-forest focus:outline-none transition-colors" />
                    <input name="email" required type="email" placeholder="Email *"
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm text-[#0A0A0F] placeholder-gray-400 focus:border-forest focus:ring-1 focus:ring-forest focus:outline-none transition-colors" />
                    <div className="grid grid-cols-2 gap-4">
                      <input name="company" placeholder="Company"
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm text-[#0A0A0F] placeholder-gray-400 focus:border-forest focus:ring-1 focus:ring-forest focus:outline-none transition-colors" />
                      <input name="phone" placeholder="Phone"
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm text-[#0A0A0F] placeholder-gray-400 focus:border-forest focus:ring-1 focus:ring-forest focus:outline-none transition-colors" />
                    </div>
                    <textarea name="message" rows={3}
                      placeholder={locale === "zh" ? "留言（如有其他感兴趣的产品请在此说明）" : "Message (mention other products of interest here)"}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm text-[#0A0A0F] placeholder-gray-400 focus:border-forest focus:ring-1 focus:ring-forest focus:outline-none transition-colors" />

                    {error && <p className="text-red-500 text-xs">{error}</p>}

                    <button type="submit" disabled={sending}
                      className="w-full py-3 bg-forest text-[#0A0A0F] font-semibold text-sm rounded-lg hover:bg-forest/90 transition-colors disabled:opacity-50">
                      {sending ? "Sending..." : "Send Inquiry →"}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
