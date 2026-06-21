"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";

interface InquiryFormProps { productId?: string; locale: string; }

export default function InquiryForm({ productId, locale }: InquiryFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    if (form.get("website_url")) { setSubmitted(true); return; }
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId, name: form.get("name"), email: form.get("email"),
          company: form.get("company"), phone: form.get("phone"), message: form.get("message"),
          locale, page_url: typeof window !== "undefined" ? window.location.pathname : "",
          utm_source: params.get("utm_source") || "", utm_medium: params.get("utm_medium") || "", utm_campaign: params.get("utm_campaign") || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Network error");
    }
  }

  if (submitted) {
    return <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
      <span className="text-4xl">✅</span><p className="text-forest mt-4">Thank you! We'll get back to you shortly.</p>
    </motion.div>;
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="website_url" type="text" tabIndex={-1} autoComplete="off" className="absolute left-[-9999px] opacity-0 h-0 w-0" />
        <input name="name" required placeholder="Name *" className="w-full bg-deep-dark border border-silver/10 rounded-lg px-4 py-3 text-sm text-white placeholder-silver/30 focus:border-forest/50 focus:outline-none transition-colors" />
        <input name="email" required type="email" placeholder="Email *" className="w-full bg-deep-dark border border-silver/10 rounded-lg px-4 py-3 text-sm text-white placeholder-silver/30 focus:border-forest/50 focus:outline-none transition-colors" />
        <input name="company" placeholder="Company" className="w-full bg-deep-dark border border-silver/10 rounded-lg px-4 py-3 text-sm text-white placeholder-silver/30 focus:border-forest/50 focus:outline-none transition-colors" />
        <input name="phone" placeholder="Phone" className="w-full bg-deep-dark border border-silver/10 rounded-lg px-4 py-3 text-sm text-white placeholder-silver/30 focus:border-forest/50 focus:outline-none transition-colors" />
      </div>
      <textarea name="message" rows={4} placeholder="Message" className="w-full bg-deep-dark border border-silver/10 rounded-lg px-4 py-3 text-sm text-white placeholder-silver/30 focus:border-forest/50 focus:outline-none transition-colors" />
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <Button type="submit" variant="primary">Send Inquiry</Button>
    </form>
  );
}
