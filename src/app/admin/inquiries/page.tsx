"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [filterLocale, setFilterLocale] = useState("all");
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    let query = supabase.from("inquiries").select("*").order("created_at", { ascending: false });
    if (filterLocale !== "all") query = query.eq("locale", filterLocale);
    query.then(({ data }: { data: any[] | null }) => setInquiries(data || []));
  }, [filterLocale]);
  return (
    <div className="flex">
      <AdminSidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-light tracking-wider text-white">Inquiries</h1>
          <select value={filterLocale} onChange={(e) => setFilterLocale(e.target.value)}
            className="bg-deep-dark border border-silver/10 rounded-lg px-4 py-2 text-sm text-white focus:border-forest/50 focus:outline-none">
            <option value="all">All Languages</option><option value="en">English</option><option value="zh">中文</option>
          </select>
        </div>
        <div className="bg-deep-blue/30 border border-silver/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-silver/10 text-silver/50 text-xs uppercase tracking-wider">
              <th className="text-left p-4">Date</th><th className="text-left p-4">Name</th><th className="text-left p-4">Company</th>
              <th className="text-left p-4">Email</th><th className="text-left p-4">Locale</th><th className="text-left p-4">UTM Source</th>
            </tr></thead>
            <tbody>
              {inquiries.map((inq) => (
                <tr key={inq.id} className="border-b border-silver/5 hover:bg-white/5">
                  <td className="p-4 text-silver/60 text-xs">{(inq.created_at || "").toString().slice(0, 10)}</td>
                  <td className="p-4 text-white">{inq.name}</td>
                  <td className="p-4 text-silver/60">{inq.company || "—"}</td>
                  <td className="p-4 text-ice">{inq.email}</td>
                  <td className="p-4"><span className="text-xs bg-forest/20 text-forest px-2 py-1 rounded">{inq.locale}</span></td>
                  <td className="p-4 text-silver/60 font-mono text-xs">{inq.utm_source || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
