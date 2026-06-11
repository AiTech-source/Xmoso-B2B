"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import FollowLinks from "@/components/social/FollowLinks";

// Read from cache synchronously to avoid flash
function getCached(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}

export default function Footer() {
  const [logoUrl, setLogoUrl] = useState(getCached("footer_logo_url", ""));
  const [company, setCompany] = useState(getCached("footer_company", ""));
  const [address, setAddress] = useState(getCached("footer_address", ""));
  const [email, setEmail] = useState(getCached("footer_email", ""));
  const [sustText, setSustText] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.footer_logo_url) {
          setLogoUrl(data.footer_logo_url);
          localStorage.setItem("footer_logo_url", data.footer_logo_url);
        }
        if (data.footer_company) {
          setCompany(data.footer_company);
          localStorage.setItem("footer_company", data.footer_company);
        }
        if (data.footer_address) {
          setAddress(data.footer_address);
          localStorage.setItem("footer_address", data.footer_address);
        }
        if (data.footer_email) {
          setEmail(data.footer_email);
          localStorage.setItem("footer_email", data.footer_email);
        }
        setSustText(data.footer_sustainability || "");
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="border-t border-silver/10 py-12 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-8 object-contain mb-4" />
          ) : null}
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
