"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

export default function FloatingInquiry({ locale }: { locale: string }) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    const supabase = createClient();
    if (!supabase) return;
    const form = new FormData(e.currentTarget);
    const params = new URLSearchParams(window.location.search);
    await supabase.from("inquiries").insert({
      name: form.get("name"), email: form.get("email"),
      company: form.get("company"), phone: form.get("phone"), message: form.get("message"),
      locale, page_url: window.location.pathname,
      utm_source: params.get("utm_source") || "", utm_medium: params.get("utm_medium") || "", utm_campaign: params.get("utm_campaign") || "",
    });
    setSending(false);
    setSubmitted(true);
  }

  return (
    <div className="w-full">
      {/* Button — scrolls naturally with the page */}
      <button
        onClick={() => { setOpen(true); setSubmitted(false); }}
        className="w-full px-6 py-4 rounded-xl bg-forest text-deep-dark font-medium tracking-wide hover:bg-forest/90 transition-colors flex items-center justify-center gap-2 shadow-lg text-base"
      >
        <span className="text-lg">✉</span>
        <span>Send Inquiry</span>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-50 md:w-[420px] bg-deep-blue/95 backdrop-blur-xl border border-silver/10 rounded-2xl shadow-2xl max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-silver/10">
                <h3 className="text-white font-medium tracking-wide">📩 Send Inquiry</h3>
                <button onClick={() => setOpen(false)} className="text-silver/50 hover:text-white text-lg leading-none">✕</button>
              </div>
              <div className="p-5 overflow-y-auto">
                {submitted ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                    <span className="text-4xl">✅</span>
                    <p className="text-forest mt-3 text-sm">Thank you! We&apos;ll get back to you shortly.</p>
                    <button onClick={() => setOpen(false)} className="mt-4 text-xs text-silver/50 hover:text-white">Close</button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <input name="name" required placeholder="Name *" className="w-full bg-deep-dark border border-silver/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-silver/30 focus:border-forest/50 focus:outline-none" />
                    <input name="email" required type="email" placeholder="Email *" className="w-full bg-deep-dark border border-silver/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-silver/30 focus:border-forest/50 focus:outline-none" />
                    <input name="company" placeholder="Company" className="w-full bg-deep-dark border border-silver/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-silver/30 focus:border-forest/50 focus:outline-none" />
                    <input name="phone" placeholder="Phone" className="w-full bg-deep-dark border border-silver/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-silver/30 focus:border-forest/50 focus:outline-none" />
                    <textarea name="message" rows={3} placeholder="Message" className="w-full bg-deep-dark border border-silver/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-silver/30 focus:border-forest/50 focus:outline-none" />
                    <button type="submit" disabled={sending}
                      className="w-full py-2.5 bg-forest text-deep-dark text-sm font-medium rounded-lg hover:bg-forest/90 transition-colors disabled:opacity-50">
                      {sending ? "Sending..." : "Send Inquiry"}
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
