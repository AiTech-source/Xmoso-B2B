"use client";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";

export default function LpPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [submitted, setSubmitted] = useState(false);
  const supabase = createClient();
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const searchParams = new URLSearchParams(window.location.search);
    await supabase.from("inquiries").insert({
      name: form.get("name"), email: form.get("email"), company: form.get("company"),
      message: form.get("message"), locale, page_url: window.location.pathname,
      utm_source: searchParams.get("utm_source") || "", utm_medium: searchParams.get("utm_medium") || "", utm_campaign: searchParams.get("utm_campaign") || "",
    });
    setSubmitted(true);
  }
  return (
    <main className="min-h-screen bg-deep-dark">
      <section className="min-h-[70vh] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-light tracking-wider text-white mb-6">Precision Wine Cooling</h1>
          <p className="text-silver/60 mb-8">German-engineered cabinets that preserve your collection at the perfect temperature.</p>
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
              <input name="name" required placeholder="Name *" className="w-full bg-deep-blue/50 border border-silver/20 rounded-lg px-4 py-3 text-sm text-white placeholder-silver/30 focus:border-forest/50 focus:outline-none" />
              <input name="email" required type="email" placeholder="Email *" className="w-full bg-deep-blue/50 border border-silver/20 rounded-lg px-4 py-3 text-sm text-white placeholder-silver/30 focus:border-forest/50 focus:outline-none" />
              <input name="company" placeholder="Company" className="w-full bg-deep-blue/50 border border-silver/20 rounded-lg px-4 py-3 text-sm text-white placeholder-silver/30 focus:border-forest/50 focus:outline-none" />
              <textarea name="message" rows={3} placeholder="Tell us about your needs" className="w-full bg-deep-blue/50 border border-silver/20 rounded-lg px-4 py-3 text-sm text-white placeholder-silver/30 focus:border-forest/50 focus:outline-none" />
              <Button type="submit" size="lg" className="w-full">Request Quote</Button>
            </form>
          ) : (
            <div className="text-center py-12"><span className="text-4xl">✅</span><p className="text-forest mt-4">Thanks! We'll be in touch shortly.</p></div>
          )}
        </motion.div>
      </section>
    </main>
  );
}
