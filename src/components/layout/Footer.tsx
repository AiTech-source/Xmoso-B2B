"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import FollowLinks from "@/components/social/FollowLinks";
import { cdnUrl } from "@/lib/cdn";

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
  const [copyright, setCopyright] = useState(getCached("copyright_text", "© 2026 Xmoso. All rights reserved."));

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
        if (data.copyright_text) {
          setCopyright(data.copyright_text);
          localStorage.setItem("copyright_text", data.copyright_text);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <footer id="xmoso-footer" style={{ borderTop: "1px solid rgba(192,192,192,0.1)", padding: "48px 16px", backgroundColor: "#0A0A0F" }}>
      <style>{`
        #xmoso-footer,
        #xmoso-footer p, #xmoso-footer a, #xmoso-footer div, #xmoso-footer span, #xmoso-footer h4 {
          color: #CCCCCC !important;
          border-color: rgba(192,192,192,0.1) !important;
        }
        #xmoso-footer { font-size: 13px !important; }
        #xmoso-footer .footer-company,
        #xmoso-footer .footer-company p {
          color: #E8E8E8 !important;
          font-size: 12px !important;
          letter-spacing: 0.02em !important;
          line-height: 1.7 !important;
        }
        #xmoso-footer .footer-title {
          color: #FFFFFF !important;
          font-size: 11px !important;
          font-weight: 500 !important;
          letter-spacing: 0.12em !important;
          margin-bottom: 14px !important;
        }
        #xmoso-footer a {
          color: #CCCCCC !important;
          text-decoration: none !important;
          font-size: 12px !important;
          letter-spacing: 0.03em !important;
        }
        #xmoso-footer a:hover {
          color: #009f4b !important;
        }
        #xmoso-footer img {
          display: block !important;
          margin-left: 0 !important;
          margin-right: auto !important;
        }
        #xmoso-footer .footer-copyright {
          color: #999999 !important;
          font-size: 11px !important;
          letter-spacing: 0.05em !important;
        }
        #xmoso-footer .footer-sust {
          color: #CCCCCC !important;
          font-size: 12px !important;
          letter-spacing: 0.02em !important;
          line-height: 1.7 !important;
        }
        #xmoso-footer .footer-links {
          display: flex !important;
          flex-direction: column !important;
          gap: 6px !important;
        }
      `}</style>

      <div style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "32px" }}>
        {/* Column 1: Logo + Company */}
        <div>
          {logoUrl && (
            <img src={cdnUrl(logoUrl)} alt="Xmoso" width="160" height="32" fetchPriority="high"
              style={{ height: "28px", width: "auto", objectFit: "contain", marginBottom: "20px" }} />
          )}
          <div className="footer-company">
            {company && <p>{company}</p>}
            {address && <p>{address}</p>}
            {email && <p>{email}</p>}
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <div className="footer-title">Quick Links</div>
          <div className="footer-links">
            <Link href="/products">Products</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/faq">FAQ</Link>
          </div>
          <FollowLinks />
        </div>

        {/* Column 3: Sustainability */}
        <div>
          <div className="footer-title">Sustainability</div>
          <p className="footer-sust">{sustText || "Committed to reducing carbon footprint through energy-efficient cooling technology and sustainable manufacturing."}</p>
        </div>
      </div>

      <div className="footer-copyright" style={{ maxWidth: "1280px", margin: "32px auto 0", paddingTop: "32px", borderTop: "1px solid rgba(192,192,192,0.05)", textAlign: "center" }}>
        {copyright}
      </div>
    </footer>
  );
}
