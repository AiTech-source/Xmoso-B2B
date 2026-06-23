"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminInquiriesPage() {
  const supabase = createClient();
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [filterLocale, setFilterLocale] = useState("all");
  const [showSpam, setShowSpam] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  function load() {
    if (!supabase) return;
    let query = supabase.from("inquiries").select("*").order("created_at", { ascending: false });
    if (filterLocale !== "all") query = query.eq("locale", filterLocale);
    if (!showSpam) query = query.eq("is_spam", false);
    query.then(({ data }: { data: any[] | null }) => setInquiries(data || []));
  }

  useEffect(() => { load(); }, [filterLocale, showSpam]);

  async function toggleRead(id: string, current: boolean) {
    if (!supabase) return;
    await supabase.from("inquiries").update({ is_read: !current }).eq("id", id);
    load();
  }

  async function toggleSpam(id: string, current: boolean) {
    if (!supabase) return;
    await supabase.from("inquiries").update({ is_spam: !current }).eq("id", id);
    load();
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-light tracking-wider text-white">
            📨 Inquiries
            <span className="text-sm text-silver/40 ml-3 font-normal">{inquiries.length} shown</span>
          </h1>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showSpam} onChange={(e) => setShowSpam(e.target.checked)}
                className="w-4 h-4 rounded accent-forest" />
              <span className="text-xs text-silver/50">Show spam</span>
            </label>
            <select value={filterLocale} onChange={(e) => setFilterLocale(e.target.value)}
              className="bg-deep-dark border border-silver/10 rounded-lg px-4 py-2 text-sm text-white focus:border-forest/50 focus:outline-none">
              <option value="all">All Languages</option><option value="en">English</option><option value="zh">中文</option>
            </select>
          </div>
        </div>

        <div className="bg-deep-blue/30 border border-silver/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-silver/10 text-silver/50 text-xs uppercase tracking-wider">
                <th className="text-left p-4 w-8"></th>
                <th className="text-left p-4 w-12">Spam</th>
                <th className="text-left p-4">Date</th>
                <th className="text-left p-4">Name</th>
                <th className="text-left p-4">Company</th>
                <th className="text-left p-4">Email</th>
                <th className="text-left p-4">Locale</th>
                <th className="text-left p-4">UTM Source</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inq) => (
                <tr key={inq.id}
                  onClick={() => setExpanded(expanded === inq.id ? null : inq.id)}
                  className={`border-b border-silver/5 hover:bg-white/5 cursor-pointer transition-colors ${inq.is_spam ? "bg-red-900/10" : inq.is_read ? "" : "bg-forest/[0.03]"}`}>
                  <td className="p-4 text-center">
                    <button onClick={(e) => { e.stopPropagation(); toggleRead(inq.id, inq.is_read); }}
                      className={`w-3 h-3 rounded-full inline-block ${inq.is_read ? "bg-silver/20" : "bg-forest"}`}
                      title={inq.is_read ? "Mark unread" : "Mark read"} />
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={(e) => { e.stopPropagation(); toggleSpam(inq.id, inq.is_spam); }}
                      className={`text-xs px-1.5 py-0.5 rounded ${inq.is_spam ? "bg-red-400/20 text-red-400" : "text-silver/30 hover:text-red-400"}`}
                      title={inq.is_spam ? "Not spam" : "Mark spam"}>
                      {inq.is_spam ? "🚫" : "○"}
                    </button>
                  </td>
                  <td className="p-4 text-silver/60 text-xs whitespace-nowrap">
                    {(inq.created_at || "").toString().slice(0, 16).replace("T", " ")}
                  </td>
                  <td className={`p-4 ${inq.is_read ? "text-silver/60" : "text-white"}`}>{inq.name}</td>
                  <td className="p-4 text-silver/60">{inq.company || "—"}</td>
                  <td className={`p-4 ${inq.is_read ? "text-silver/50" : "text-ice"}`}>
                    <a href={`mailto:${inq.email}`} className="hover:underline">{inq.email}</a>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded ${inq.is_read ? "bg-silver/10 text-silver/40" : "bg-forest/20 text-forest"}`}>
                      {inq.locale}
                    </span>
                  </td>
                  <td className="p-4 text-silver/60 font-mono text-xs">{inq.utm_source || "—"}</td>
                </tr>
              ))}
              {inquiries.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-xs text-silver/40">No inquiries found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {expanded && (() => {
          const inq = inquiries.find((i) => i.id === expanded);
          if (!inq) return null;
          return (
            <div className="mt-4 bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white tracking-wide">📋 Inquiry Detail</h3>
                <div className="flex gap-2">
                  <button onClick={() => toggleSpam(inq.id, inq.is_spam)}
                    className={`text-xs px-3 py-1 rounded ${inq.is_spam ? "bg-green-400/20 text-green-400" : "bg-red-400/20 text-red-400"}`}>
                    {inq.is_spam ? "Not spam" : "Mark as spam"}
                  </button>
                  <button onClick={() => setExpanded(null)} className="text-silver/40 hover:text-white text-xs">✕ Close</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 max-w-2xl mb-4">
                <div>
                  <p className="text-[10px] text-silver/40 uppercase tracking-wider mb-1">Phone</p>
                  <p className="text-sm text-white">{inq.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-silver/40 uppercase tracking-wider mb-1">Page URL</p>
                  <p className="text-sm text-silver/60 break-all">{inq.page_url || "—"}</p>
                </div>
              </div>
              {inq.message && (
                <div className="mb-4">
                  <p className="text-[10px] text-silver/40 uppercase tracking-wider mb-1">Message</p>
                  <p className="text-sm text-white/80 bg-deep-dark/60 rounded-lg p-4 leading-relaxed">{inq.message}</p>
                </div>
              )}
              {(inq.utm_source || inq.utm_medium || inq.utm_campaign) && (
                <div className="flex gap-4 text-xs text-silver/40 font-mono">
                  {inq.utm_source && <span>src: {inq.utm_source}</span>}
                  {inq.utm_medium && <span>med: {inq.utm_medium}</span>}
                  {inq.utm_campaign && <span>cmp: {inq.utm_campaign}</span>}
                </div>
              )}
            </div>
          );
        })()}
      </main>
    </div>
  );
}
