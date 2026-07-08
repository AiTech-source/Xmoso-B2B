"use client";
import { useState, useEffect } from "react";

const PLATFORMS = [
  { key: "social_youtube", icon: "▶", label: "YouTube" },
  { key: "social_instagram", icon: "📷", label: "Instagram" },
  { key: "social_tiktok", icon: "🎵", label: "TikTok" },
  { key: "social_linkedin", icon: "in", label: "LinkedIn" },
];

export default function FollowLinks() {
  const [links, setLinks] = useState<Record<string, string>>({});
  const [showWechat, setShowWechat] = useState(false);
  const [wechatQr, setWechatQr] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        const result: Record<string, string> = {};
        PLATFORMS.forEach((p) => { if (data[p.key]) result[p.key] = data[p.key]; });
        setLinks(result);
        setWechatQr(data.social_wechat_qr || "");
      });
  }, []);

  if (Object.keys(links).length === 0 && !wechatQr) return null;

  return (
    <div className="mt-6">
      <h4 className="text-sm font-medium text-white mb-3 uppercase tracking-wider">Follow Us</h4>
      <div className="flex flex-wrap gap-3">
        {PLATFORMS.filter((p) => links[p.key]).map((p) => (
          <a key={p.key} href={links[p.key]} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-deep-blue/30 border border-silver/10 text-xs text-silver/60 hover:text-white hover:border-forest/30 transition-all">
            <span>{p.icon}</span>
            <span>{p.label}</span>
          </a>
        ))}
        {wechatQr && (
          <div className="relative">
            <button onClick={() => setShowWechat(!showWechat)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-deep-blue/30 border border-silver/10 text-xs text-silver/60 hover:text-white hover:border-forest/30 transition-all">
              <span>💬</span><span>WeChat</span>
            </button>
            {showWechat && (
              <div style={{
                position: "absolute", bottom: "100%", marginBottom: "8px",
                left: "50%", transform: "translateX(-50%)",
                background: "#1A1A2E", border: "1px solid rgba(192,192,192,0.1)",
                borderRadius: "12px", padding: "16px",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", zIndex: 50,
                animation: "fadeIn 0.15s ease-out",
              }}>
                <img src={wechatQr} alt="WeChat QR" className="w-36 h-36 object-contain" />
                <p className="text-xs text-silver/50 text-center mt-2">Scan to follow</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
