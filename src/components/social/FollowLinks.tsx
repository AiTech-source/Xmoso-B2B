"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
            <AnimatePresence>
              {showWechat && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-deep-blue border border-silver/10 rounded-xl p-4 shadow-2xl z-50">
                  <img src={wechatQr} alt="WeChat QR" className="w-36 h-36 object-contain" />
                  <p className="text-xs text-silver/50 text-center mt-2">Scan to follow</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
