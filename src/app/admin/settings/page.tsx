"use client";
import { useEffect, useState, useRef } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Button from "@/components/ui/Button";
import { compressImage } from "@/lib/image/compress";

export default function AdminSettingsPage() {
  const [theme, setTheme] = useState("dark");
  const [logoUrl, setLogoUrl] = useState("");
  const [footerLogoUrl, setFooterLogoUrl] = useState("");
  const [footerSust, setFooterSust] = useState("");
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [social, setSocial] = useState<Record<string, string>>({});
  const [wechatQrUrl, setWechatQrUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [siteTitle, setSiteTitle] = useState("");
  const [ogBrand, setOgBrand] = useState("");
  const [ogSiteUrl, setOgSiteUrl] = useState("");
  const [gaId, setGaId] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [notifEmail, setNotifEmail] = useState("");
  const [passCurrent, setPassCurrent] = useState("");
  const [passNew, setPassNew] = useState("");
  const [passConfirm, setPassConfirm] = useState("");
  const [passMsg, setPassMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingFooter, setUploadingFooter] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const footerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setTheme(data.default_theme); setLogoUrl(data.logo_url);
        setFooterLogoUrl(data.footer_logo_url); setFooterSust(data.footer_sustainability);
        setCompany(data.footer_company || ""); setAddress(data.footer_address || ""); setEmail(data.footer_email || "");
        const s: Record<string, string> = {};
        ["social_youtube","social_instagram","social_tiktok","social_linkedin"].forEach((k) => { if (data[k]) s[k] = data[k]; });
        setSocial(s);
        setWechatQrUrl(data.social_wechat_qr || "");
        setFaviconUrl(data.favicon_url || "/favicon.svg");
        setSiteTitle(data.site_title || "DeepCool");
        setOgBrand(data.og_brand_name || "DeepCool");
        setOgSiteUrl(data.og_site_url || "deepcool.com");
        setGaId(data.ga_id || "");
        setSmtpHost(data.smtp_host || ""); setSmtpPort(data.smtp_port || "587");
        setSmtpUser(data.smtp_user || ""); setSmtpPass(data.smtp_pass || "");
        setSmtpSecure(data.smtp_secure === "true");
        setNotifEmail(data.notification_email || "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function saveTheme() {
    setSaving(true);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "default_theme", value: theme }),
    });
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    setSaving(false);
  }

  function saveSetting(key: string, value: string) {
    return fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
  }

  async function handleFooterLogoUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploadingFooter(true);
    const file = files[0];
    try {
      const compressed = await compressImage(file, 400, 0.9);
      const path = `logos/footer-${Date.now()}.webp`;
      const formData = new FormData();
      formData.append("file", compressed, `${path}.webp`);
      formData.append("path", path);
      formData.append("bucket", "products");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await res.json();
      if (result.error) { alert(result.error); return; }
      await saveSetting("footer_logo_url", result.url);
      setFooterLogoUrl(result.url);
    } catch (e: any) { alert(e.message); }
    setUploadingFooter(false);
  }

  const wechatInputRef = useRef<HTMLInputElement>(null);

  async function handleWechatQrUpload(files: FileList | null) {
    if (!files?.length) return;
    const file = files[0];
    try {
      const compressed = await compressImage(file, 400, 0.85);
      const path = `social/wechat-${Date.now()}.webp`;
      const formData = new FormData();
      formData.append("file", compressed, `wechat.webp`);
      formData.append("path", path);
      formData.append("bucket", "products");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await res.json();
      if (result.error) { alert(result.error); return; }
      await saveSetting("social_wechat_qr", result.url);
      setWechatQrUrl(result.url);
    } catch (e: any) { alert(e.message); }
  }

  async function handleLogoUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    const file = files[0];
    try {
      const compressed = await compressImage(file, 400, 0.9);
      const path = `logos/${Date.now()}.webp`;
      const formData = new FormData();
      formData.append("file", compressed, `${path}.webp`);
      formData.append("path", path);
      formData.append("bucket", "products");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await res.json();
      if (result.error) { alert(result.error); return; }
      // Save to site settings
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "logo_url", value: result.url }),
      });
      setLogoUrl(result.url);
    } catch (e: any) { alert(e.message); }
    setUploading(false);
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="ml-64 flex-1 p-8">
        <h1 className="text-2xl font-light tracking-wider text-white mb-8">⚙️ Site Settings</h1>

        {loading ? (
          <p className="text-silver/40 text-sm">Loading...</p>
        ) : (
          <div className="max-w-lg space-y-8">

            {/* Logo */}
            <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
              <h3 className="text-white tracking-wide mb-4">🖼 Logo</h3>
              <p className="text-xs text-silver/50 mb-4">Upload your brand logo. Max width 400px, auto-compressed to WebP.</p>

              {logoUrl && (
                <div className="mb-4 p-4 bg-deep-dark/40 border border-silver/10 rounded-lg flex items-center gap-4">
                  <img src={logoUrl} alt="Logo" className="h-10 object-contain" />
                  <span className="text-xs text-silver/40 truncate flex-1">{logoUrl.split("/").pop()}</span>
                  <button onClick={() => {
                    fetch("/api/settings", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ key: "logo_url", value: "" }),
                    });
                    setLogoUrl("");
                  }} className="text-red-400/60 hover:text-red-400 text-xs">Remove</button>
                </div>
              )}

              <div className="flex gap-3">
                <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e.target.files)} />
                <Button size="sm" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
                  {uploading ? "⏳ Uploading..." : "📁 Upload Logo"}
                </Button>
              </div>
            </div>

            {/* Site Identity */}
            <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
              <h3 className="text-white tracking-wide mb-4">🔤 Site Identity</h3>
              <p className="text-xs text-silver/50 mb-4">Set your brand name that appears in browser tab titles, and custom favicon.</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-silver/50 mb-1">Browser Tab Title Suffix</p>
                  <div className="flex gap-2">
                    <input value={siteTitle} onChange={(e) => setSiteTitle(e.target.value)}
                      placeholder="DeepCool" className="flex-1 bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white" />
                    <Button size="sm" onClick={async () => { await saveSetting("site_title", siteTitle); }}>Save</Button>
                  </div>
                  <p className="text-[10px] text-silver/40 mt-1">Pages will show like: "Products — {siteTitle || 'DeepCool'}"</p>
                </div>
                <div>
                  <p className="text-xs text-silver/50 mb-1">Favicon</p>
                  <div className="flex gap-2">
                    <input value={faviconUrl} onChange={(e) => setFaviconUrl(e.target.value)}
                      placeholder="/favicon.svg" className="flex-1 bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white font-mono text-xs" />
                    <label className="px-3 py-2 text-xs bg-ice/20 text-ice border border-ice/30 rounded hover:bg-ice/30 transition-colors cursor-pointer whitespace-nowrap">
                      📁 Upload
                      <input type="file" accept=".svg,.png,.ico" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0]; if (!file) return;
                        try {
                          const formData = new FormData();
                          formData.append("file", file, file.name);
                          formData.append("path", `favicon/${Date.now()}-${file.name}`);
                          formData.append("bucket", "products");
                          const res = await fetch("/api/upload", { method: "POST", body: formData });
                          const result = await res.json();
                          if (result.url) {
                            setFaviconUrl(result.url);
                            await saveSetting("favicon_url", result.url);
                          }
                        } catch (e: any) { alert(e.message); }
                        e.target.value = "";
                      }} />
                    </label>
                    <Button size="sm" onClick={async () => { await saveSetting("favicon_url", faviconUrl); }}>Save</Button>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <img src={faviconUrl} alt="" className="w-6 h-6 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <span className="text-[10px] text-silver/40 truncate">{faviconUrl}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-silver/10">
                <p className="text-xs text-silver/50 mb-2">OG Image Branding</p>
                <div className="flex gap-2 mb-2">
                  <input value={ogBrand} onChange={(e) => setOgBrand(e.target.value)}
                    placeholder="Brand name (e.g. DeepCool)" className="flex-1 bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white" />
                  <Button size="sm" onClick={async () => { await saveSetting("og_brand_name", ogBrand); }}>Save</Button>
                </div>
                <div className="flex gap-2">
                  <input value={ogSiteUrl} onChange={(e) => setOgSiteUrl(e.target.value)}
                    placeholder="Site URL (e.g. deepcool.com)" className="flex-1 bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white" />
                  <Button size="sm" onClick={async () => { await saveSetting("og_site_url", ogSiteUrl); }}>Save</Button>
                </div>
              </div>
            </div>

            {/* Google Analytics */}
            <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
              <h3 className="text-white tracking-wide mb-4">📊 Google Analytics</h3>
              <p className="text-xs text-silver/50 mb-3">Enter your GA4 Measurement ID to enable website tracking.</p>
              <div className="flex gap-2">
                <input value={gaId} onChange={(e) => setGaId(e.target.value)}
                  placeholder="G-XXXXXXXXXX" className="flex-1 bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white font-mono" />
                <Button size="sm" onClick={async () => { await saveSetting("ga_id", gaId); }}>Save</Button>
              </div>
            </div>

            {/* Change Password */}
            <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
              <h3 className="text-white tracking-wide mb-4">🔑 Change Password</h3>
              <p className="text-xs text-silver/50 mb-4">Update your admin account password.</p>
              <div className="space-y-3">
                <input value={passCurrent} onChange={(e) => setPassCurrent(e.target.value)} type="password"
                  placeholder="Current password" className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white" />
                <input value={passNew} onChange={(e) => setPassNew(e.target.value)} type="password"
                  placeholder="New password" className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white" />
                <input value={passConfirm} onChange={(e) => setPassConfirm(e.target.value)} type="password"
                  placeholder="Confirm new password" className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white" />
                {passMsg && <p className={`text-xs ${passMsg.startsWith("✅") ? "text-forest" : "text-red-400"}`}>{passMsg}</p>}
                <Button size="sm" onClick={async () => {
                  setPassMsg("");
                  if (!passCurrent) { setPassMsg("Current password is required"); return; }
                  if (!passNew || passNew.length < 6) { setPassMsg("New password must be at least 6 characters"); return; }
                  if (passNew !== passConfirm) { setPassMsg("Passwords do not match"); return; }
                  const res = await fetch("/api/admin/profile", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ current_password: passCurrent, new_password: passNew }),
                  });
                  const d = await res.json();
                  if (d.error) { setPassMsg(d.error); return; }
                  setPassMsg("✅ Password updated successfully");
                  setPassCurrent(""); setPassNew(""); setPassConfirm("");
                }}>Update Password</Button>
              </div>
            </div>

            {/* SMTP Email */}
            <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
              <h3 className="text-white tracking-wide mb-4">📧 Email Notifications</h3>
              <p className="text-xs text-silver/50 mb-3">Configure SMTP to receive email when a visitor submits an inquiry form.</p>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="SMTP Host (e.g. smtp.company.com)" className="flex-1 bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white" />
                  <input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)}
                    placeholder="Port" className="w-20 bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white" />
                  <Button size="sm" onClick={async () => { await saveSetting("smtp_host", smtpHost); await saveSetting("smtp_port", smtpPort); }}>Save</Button>
                </div>
                <div className="flex gap-2">
                  <input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="SMTP Username" className="flex-1 bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white" />
                  <input value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} type="password"
                    placeholder="SMTP Password" className="flex-1 bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white" />
                  <Button size="sm" onClick={async () => { await saveSetting("smtp_user", smtpUser); await saveSetting("smtp_pass", smtpPass); }}>Save</Button>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={smtpSecure} onChange={(e) => { setSmtpSecure(e.target.checked); saveSetting("smtp_secure", e.target.checked ? "true" : "false"); }}
                      className="w-4 h-4 rounded accent-forest" />
                    <span className="text-sm text-silver/60">Use SSL/TLS (port 465)</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <input value={notifEmail} onChange={(e) => setNotifEmail(e.target.value)}
                    placeholder="Notification Email (where alerts are sent)" className="flex-1 bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white" />
                  <Button size="sm" onClick={async () => { await saveSetting("notification_email", notifEmail); }}>Save</Button>
                </div>
                <div className="pt-2">
                  <Button size="sm" variant="outline" onClick={async () => {
                    setSaving(true);
                    try {
                      const res = await fetch("/api/test-email", { method: "POST" });
                      const data = await res.json();
                      if (data.success) {
                        alert(`✅ Test email sent! Check ${notifEmail || "your inbox"}.`);
                      } else {
                        alert(`❌ Failed: ${data.error}\n\nSettings: ${JSON.stringify(data.settings, null, 2)}`);
                      }
                    } catch (e: any) {
                      alert(`❌ Error: ${e.message}`);
                    }
                    setSaving(false);
                  }} disabled={saving}>
                    {saving ? "Sending..." : "📧 Send Test Email"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Theme */}
            <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
              <h3 className="text-white tracking-wide mb-4">🎨 Default Theme</h3>
              <p className="text-xs text-silver/50 mb-4">
                Choose which theme all visitors see by default.
              </p>

              <div className="flex gap-4 mb-6">
                <button onClick={() => setTheme("dark")}
                  className={`flex-1 p-6 rounded-xl border-2 transition-all ${
                    theme === "dark" ? "border-forest bg-deep-dark" : "border-silver/20 bg-deep-dark/50 hover:border-silver/40"
                  }`}>
                  <div className="w-8 h-8 rounded-full bg-deep-dark border border-silver/20 mx-auto mb-3" />
                  <p className="text-sm text-white font-medium">🌙 Dark</p>
                  <p className="text-[10px] text-silver/50 mt-1">Elegant, high contrast</p>
                </button>
                <button onClick={() => setTheme("light")}
                  className={`flex-1 p-6 rounded-xl border-2 transition-all ${
                    theme === "light" ? "border-forest bg-white" : "border-silver/20 bg-white/50 hover:border-silver/40"
                  }`}>
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-800 font-medium">☀️ Light</p>
                  <p className="text-[10px] text-gray-400 mt-1">Bright, product-focused</p>
                </button>
              </div>

              <Button onClick={saveTheme} disabled={saving}>
                {saving ? "Saving..." : "💾 Save Theme"}
              </Button>
            </div>

            {/* Footer Settings */}
            <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
              <h3 className="text-white tracking-wide mb-4">🦶 Footer</h3>

              {/* Footer Logo */}
              <p className="text-xs text-silver/50 mb-3">Footer Logo</p>
              {footerLogoUrl && (
                <div className="mb-3 p-3 bg-deep-dark/40 border border-silver/10 rounded-lg flex items-center gap-3">
                  <img src={footerLogoUrl} alt="Footer Logo" className="h-8 object-contain" />
                  <button onClick={() => { saveSetting("footer_logo_url", ""); setFooterLogoUrl(""); }}
                    className="text-red-400/60 hover:text-red-400 text-xs ml-auto">Remove</button>
                </div>
              )}
              <div className="flex gap-3 mb-6">
                <input ref={footerInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFooterLogoUpload(e.target.files)} />
                <Button size="sm" variant="outline" disabled={uploadingFooter} onClick={() => footerInputRef.current?.click()}>
                  {uploadingFooter ? "⏳ Uploading..." : "📁 Upload Footer Logo"}
                </Button>
              </div>

              {/* Company Info */}
              <p className="text-xs text-silver/50 mb-3">Company Info</p>
              <div className="space-y-2 mb-4">
                <input value={company} onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company Name" className="w-full bg-deep-dark border border-silver/10 rounded-lg px-4 py-2 text-sm text-white placeholder-silver/30" />
                <input value={address} onChange={(e) => setAddress(e.target.value)}
                  placeholder="Address" className="w-full bg-deep-dark border border-silver/10 rounded-lg px-4 py-2 text-sm text-white placeholder-silver/30" />
                <input value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email" className="w-full bg-deep-dark border border-silver/10 rounded-lg px-4 py-2 text-sm text-white placeholder-silver/30" />
              </div>
              <Button size="sm" onClick={async () => {
                await saveSetting("footer_company", company);
                await saveSetting("footer_address", address);
                await saveSetting("footer_email", email);
              }}>💾 Save Company Info</Button>

              {/* Sustainability Text */}
              <p className="text-xs text-silver/50 mb-2">Sustainability text</p>
              <textarea value={footerSust} onChange={(e) => setFooterSust(e.target.value)}
                className="w-full bg-deep-dark border border-silver/10 rounded-lg px-4 py-3 text-sm text-white mb-2 min-h-[80px]"
                placeholder="Enter sustainability description text..." />
              <Button size="sm" onClick={async () => { await saveSetting("footer_sustainability", footerSust); }}>
                💾 Save Footer Text
              </Button>

              {/* Preview */}
              <div className="mt-4 p-4 bg-deep-dark/40 border border-silver/10 rounded-lg">
                <p className="text-[10px] text-silver/40 uppercase tracking-wider mb-2">Preview</p>
                <div className="flex items-start gap-2 mb-2">
                  {footerLogoUrl ? (
                    <img src={footerLogoUrl} alt="" className="h-6 object-contain" />
                  ) : (
                    <span className="text-xs text-silver/40 font-bold">DEEP<span className="text-forest">COOL</span></span>
                  )}
                </div>
                <p className="text-xs text-silver/60 leading-relaxed">{footerSust || "(no text set)"}</p>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
              <h3 className="text-white tracking-wide mb-4">📱 Social Media</h3>
              <p className="text-xs text-silver/50 mb-4">Enter your brand social media URLs. Leave blank to hide from footer.</p>
              <div className="space-y-2">
                {[
                  { key: "social_youtube", label: "YouTube URL", icon: "▶" },
                  { key: "social_instagram", label: "Instagram URL", icon: "📷" },
                  { key: "social_tiktok", label: "TikTok URL", icon: "🎵" },
                  { key: "social_linkedin", label: "LinkedIn URL", icon: "in" },
                ].map((field) => (
                  <div key={field.key} className="flex items-center gap-2">
                    <span className="w-6 text-center text-sm">{field.icon}</span>
                    <input value={social[field.key] || ""} onChange={(e) => setSocial({...social, [field.key]: e.target.value})}
                      placeholder={field.label} className="flex-1 bg-deep-dark border border-silver/10 rounded px-3 py-2 text-xs text-white" />
                    <Button size="sm" onClick={async () => { await saveSetting(field.key, social[field.key] || ""); }}>Save</Button>
                  </div>
                ))}
                <div className="flex items-center gap-2 mt-2">
                  <span className="w-6 text-center text-sm">💬</span>
                  {wechatQrUrl ? (
                    <div className="flex-1 flex items-center gap-2">
                      <img src={wechatQrUrl} alt="WeChat QR" className="h-10 w-10 object-cover rounded" />
                      <span className="text-xs text-silver/40 truncate">QR Code set</span>
                      <button onClick={async () => { await saveSetting("social_wechat_qr", ""); setWechatQrUrl(""); }}
                        className="text-red-400/60 hover:text-red-400 text-xs">Remove</button>
                    </div>
                  ) : (
                    <span className="text-xs text-silver/40 flex-1">No WeChat QR code uploaded</span>
                  )}
                  <input ref={wechatInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleWechatQrUpload(e.target.files)} />
                  <Button size="sm" variant="outline" onClick={() => wechatInputRef.current?.click()}>📁 Upload QR</Button>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
