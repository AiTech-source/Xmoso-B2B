"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

function daysAgo(n: number): string {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString();
}

export default function AdminAnalyticsPage() {
  const supabase = createClient();
  const [tab, setTab] = useState("views");
  const [days, setDays] = useState(7);
  const [viewsByDay, setViewsByDay] = useState<{ date: string; count: number }[]>([]);
  const [viewsByCountry, setViewsByCountry] = useState<{ country: string; count: number }[]>([]);
  const [inquiryTrend, setInquiryTrend] = useState<{ date: string; count: number }[]>([]);
  const [inquiryByLocale, setInquiryByLocale] = useState<{ locale: string; count: number }[]>([]);
  const [inquiryBySource, setInquiryBySource] = useState<{ source: string; count: number }[]>([]);
  const [inquiryTotals, setInquiryTotals] = useState({ total: 0, unread: 0, today: 0 });

  const CHART_OPTS = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { x: { ticks: { color: "#888" } }, y: { ticks: { color: "#888" } } },
  };

  function loadViews() {
    if (!supabase) return;
    const since = daysAgo(days);
    supabase.from("page_views").select("created_at").gte("created_at", since).then(({ data }: { data: any[] | null }) => {
      const map: Record<string, number> = {};
      (data || []).forEach((v: any) => { const day = new Date(v.created_at).toLocaleDateString(); map[day] = (map[day] || 0) + 1; });
      setViewsByDay(Object.entries(map).map(([date, count]) => ({ date, count: count as number })));
    });
    supabase.from("page_views").select("country").then(({ data }: { data: any[] | null }) => {
      const map: Record<string, number> = {};
      (data || []).forEach((v: any) => { if (v.country) map[v.country] = (map[v.country] || 0) + 1; });
      setViewsByCountry(Object.entries(map).map(([c, n]) => ({ country: c, count: n as number })).sort((a, b) => b.count - a.count).slice(0, 10));
    });
  }

  function loadInquiries() {
    if (!supabase) return;
    const since = daysAgo(days);
    supabase.from("inquiries").select("created_at, locale, utm_source, is_read").gte("created_at", since).then(({ data }: { data: any[] | null }) => {
      const items = data || [];
      const trendMap: Record<string, number> = {};
      const localeMap: Record<string, number> = {};
      const sourceMap: Record<string, number> = {};
      items.forEach((v: any) => {
        const d = new Date(v.created_at).toLocaleDateString();
        trendMap[d] = (trendMap[d] || 0) + 1;
        localeMap[v.locale || "en"] = (localeMap[v.locale || "en"] || 0) + 1;
        if (v.utm_source) sourceMap[v.utm_source] = (sourceMap[v.utm_source] || 0) + 1;
      });
      setInquiryTrend(Object.entries(trendMap).map(([date, count]) => ({ date, count: count as number })));
      setInquiryByLocale(Object.entries(localeMap).map(([locale, count]) => ({ locale, count: count as number })));
      setInquiryBySource(Object.entries(sourceMap).map(([s, c]) => ({ source: s, count: c as number })).sort((a, b) => b.count - a.count));
    });

    supabase.from("inquiries").select("id, is_read, created_at").then(({ data }: { data: any[] | null }) => {
      const all = data || [];
      const today = new Date().toISOString().slice(0, 10);
      setInquiryTotals({
        total: all.length,
        unread: all.filter((i: any) => !i.is_read).length,
        today: all.filter((i: any) => (i.created_at || "").startsWith(today)).length,
      });
    });
  }

  useEffect(() => { loadViews(); }, [days]);
  useEffect(() => { loadInquiries(); }, [days]);

  function exportCSV(label: string, headers: string[], rows: any[], fields: string[]) {
    const csv = [headers.join(","), ...rows.map((r) => fields.map((f) => `"${(r[f] || "").toString().replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${label}.csv`; a.click();
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-light tracking-wider text-white">📊 Analytics</h1>
          <select value={days} onChange={(e) => setDays(parseInt(e.target.value))}
            className="bg-deep-dark border border-silver/10 rounded-lg px-3 py-1.5 text-sm text-white">
            <option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option>
          </select>
        </div>

        <div className="flex gap-2 mb-6">
          {[
            ["views", "📊 Page Views"],
            ["inquiries", "📩 Inquiries"],
            ["geo", "🌍 Geography"],
          ].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-4 py-2 text-sm rounded-lg border transition-colors ${tab === id ? "bg-forest/20 text-forest border-forest/30" : "text-silver/50 border-silver/20 hover:text-white"}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === "views" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm text-silver/50 uppercase tracking-wider">Views Trend</h3>
                {viewsByDay.length > 0 && (
                  <button onClick={() => exportCSV("views-trend", ["Date", "Views"], viewsByDay, ["date", "count"])}
                    className="text-[10px] text-ice/60 hover:text-ice">Export CSV</button>
                )}
              </div>
              {viewsByDay.length > 0
                ? <Line data={{ labels: viewsByDay.map((v) => v.date), datasets: [{ label: "Views", data: viewsByDay.map((v) => v.count), borderColor: "#7EC8E3", backgroundColor: "rgba(126,200,227,0.1)", tension: 0.3 }] }} options={CHART_OPTS} />
                : <p className="text-silver/40 text-sm py-8 text-center">No data</p>}
            </div>
            <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm text-silver/50 uppercase tracking-wider">Top Countries</h3>
                {viewsByCountry.length > 0 && (
                  <button onClick={() => exportCSV("top-countries", ["Country", "Views"], viewsByCountry, ["country", "count"])}
                    className="text-[10px] text-ice/60 hover:text-ice">Export CSV</button>
                )}
              </div>
              {viewsByCountry.length > 0
                ? <Bar data={{ labels: viewsByCountry.map((v) => v.country), datasets: [{ label: "Views", data: viewsByCountry.map((v) => v.count), backgroundColor: "rgba(139,200,160,0.6)" }] }} options={CHART_OPTS} />
                : <p className="text-silver/40 text-sm py-8 text-center">No data</p>}
            </div>
          </div>
        )}

        {tab === "inquiries" && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Total", value: inquiryTotals.total, color: "text-ice" },
                { label: "Unread", value: inquiryTotals.unread, color: "text-forest" },
                { label: "Today", value: inquiryTotals.today, color: "text-white" },
              ].map((c) => (
                <div key={c.label} className="bg-deep-blue/30 border border-silver/10 rounded-xl p-5 text-center">
                  <p className="text-3xl font-light tracking-wider text-white">{c.value}</p>
                  <p className="text-xs text-silver/50 mt-1">{c.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm text-silver/50 uppercase tracking-wider">Inquiry Trend</h3>
                  {inquiryTrend.length > 0 && (
                    <button onClick={() => exportCSV("inquiry-trend", ["Date", "Count"], inquiryTrend, ["date", "count"])}
                      className="text-[10px] text-ice/60 hover:text-ice">Export CSV</button>
                  )}
                </div>
                {inquiryTrend.length > 0
                  ? <Line data={{ labels: inquiryTrend.map((v) => v.date), datasets: [{ label: "Inquiries", data: inquiryTrend.map((v) => v.count), borderColor: "#8BC8A0", backgroundColor: "rgba(139,200,160,0.1)", tension: 0.3 }] }} options={CHART_OPTS} />
                  : <p className="text-silver/40 text-sm py-8 text-center">No inquiry data</p>}
              </div>
              <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
                <h3 className="text-sm text-silver/50 uppercase tracking-wider mb-4">By Language</h3>
                {inquiryByLocale.length > 0
                  ? <Bar data={{ labels: inquiryByLocale.map((v) => v.locale), datasets: [{ label: "Inquiries", data: inquiryByLocale.map((v) => v.count), backgroundColor: ["rgba(139,200,160,0.6)", "rgba(126,200,227,0.6)"] }] }} options={CHART_OPTS} />
                  : <p className="text-silver/40 text-sm py-8 text-center">No data</p>}
              </div>
            </div>

            {inquiryBySource.length > 0 && (
              <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm text-silver/50 uppercase tracking-wider">By UTM Source</h3>
                  <button onClick={() => exportCSV("utm-sources", ["Source", "Count"], inquiryBySource, ["source", "count"])}
                    className="text-[10px] text-ice/60 hover:text-ice">Export CSV</button>
                </div>
                <Bar data={{ labels: inquiryBySource.map((v) => v.source || "(direct)"), datasets: [{ label: "Inquiries", data: inquiryBySource.map((v) => v.count), backgroundColor: "rgba(126,200,227,0.6)" }] }} options={CHART_OPTS} />
              </div>
            )}
          </div>
        )}

        {tab === "geo" && (
          <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm text-silver/50 uppercase tracking-wider">All Countries</h3>
              {viewsByCountry.length > 0 && (
                <button onClick={() => exportCSV("all-countries", ["Country", "Views"], viewsByCountry, ["country", "count"])}
                  className="text-[10px] text-ice/60 hover:text-ice">Export CSV</button>
              )}
            </div>
            {viewsByCountry.length > 0
              ? <Bar data={{ labels: viewsByCountry.map((v) => v.country), datasets: [{ label: "Views", data: viewsByCountry.map((v) => v.count), backgroundColor: "rgba(139,200,160,0.6)" }] }} options={{ ...CHART_OPTS, indexAxis: "y" as const }} />
              : <p className="text-silver/40 text-sm py-8 text-center">No country data</p>}
          </div>
        )}
      </main>
    </div>
  );
}
