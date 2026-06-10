"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import FollowLinks from "@/components/social/FollowLinks";

export default function Footer() {
  const [logoUrl, setLogoUrl] = useState("");
  const [sustText, setSustText] = useState("");
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setLogoUrl(data.footer_logo_url || "");
        setSustText(data.footer_sustainability || "");
        setCompany(data.footer_company || "");
        setAddress(data.footer_address || "");
        setEmail(data.footer_email || "");
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="border-t border-silver/10 py-12 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          {logoUrl ? (
            <img src={logoUrl} alt="DeepCool" className="h-8 object-contain mb-4" />
          ) : (
            <h3 className="text-lg font-bold tracking-widest text-white mb-4">DEEP<span className="text-forest">COOL</span></h3>
          )}
          <div className="text-sm text-silver/60 leading-relaxed space-y-1">
            {company && <p>{company}</p>}
            {address && <p>{address}</p>}
            {email && <p>{email}</p>}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-white mb-4 uppercase tracking-wider">Quick Links</h4>
          <div className="flex flex-col gap-2 text-sm text-silver/60">
            <Link href="/en/products" className="hover:text-forest transition-colors">Products</Link>
            <Link href="/en/about" className="hover:text-forest transition-colors">About</Link>
            <Link href="/en/contact" className="hover:text-forest transition-colors">Contact</Link>
            <Link href="/en/faq" className="hover:text-forest transition-colors">FAQ</Link>
          </div>
          <FollowLinks />
        </div>
        <div>
          <h4 className="text-sm font-medium text-white mb-4 uppercase tracking-wider">Sustainability</h4>
          <p className="text-sm text-silver/60 leading-relaxed">{sustText || "Committed to reducing carbon footprint through energy-efficient cooling technology and sustainable manufacturing."}</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-silver/5 text-center text-xs text-silver/40">© 2026 DeepCool. All rights reserved.</div>
    </footer>
  );
}
