"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

export default function AdminAnalyticsPage() {
  const [viewsByDay, setViewsByDay] = useState<any[]>([]);
  const [viewsByCountry, setViewsByCountry] = useState<any[]>([]);
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    async function load() {
      const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data: daily } = await supabase.from("page_views").select("created_at").gte("created_at", sevenDaysAgo.toISOString());
      const byDay: Record<string, number> = {};
      (daily || []).forEach((v: any) => { const day = new Date(v.created_at).toLocaleDateString(); byDay[day] = (byDay[day] || 0) + 1; });
      setViewsByDay(Object.entries(byDay).map(([date, count]) => ({ date, count })));
      const { data: byCountry } = await supabase.from("page_views").select("country");
      const countryMap: Record<string, number> = {};
      (byCountry || []).forEach((v: any) => { if (v.country) countryMap[v.country] = (countryMap[v.country] || 0) + 1; });
      setViewsByCountry(Object.entries(countryMap).map(([country, count]) => ({ country, count: count as number })).sort((a, b) => b.count - a.count).slice(0, 10));
    }
    load();
  }, []);
  const lineData = {
    labels: viewsByDay.map((v) => v.date),
    datasets: [{ label: "Views", data: viewsByDay.map((v) => v.count), borderColor: "#7EC8E3", backgroundColor: "rgba(126, 200, 227, 0.1)", tension: 0.3 }],
  };
  const barData = {
    labels: viewsByCountry.map((v) => v.country),
    datasets: [{ label: "Views", data: viewsByCountry.map((v) => v.count), backgroundColor: "rgba(139, 200, 160, 0.6)" }],
  };
  return (
    <div className="flex">
      <AdminSidebar />
      <main className="ml-64 flex-1 p-8">
        <h1 className="text-2xl font-light tracking-wider text-white mb-8">Analytics</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
            <h3 className="text-sm text-silver/50 uppercase tracking-wider mb-4">Views Trend (7 days)</h3>
            {viewsByDay.length > 0 ? <Line data={lineData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: "#888" } }, y: { ticks: { color: "#888" } } } }} />
              : <p className="text-silver/40 text-sm">No data yet</p>}
          </div>
          <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
            <h3 className="text-sm text-silver/50 uppercase tracking-wider mb-4">Top Countries</h3>
            {viewsByCountry.length > 0 ? <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: "#888" } }, y: { ticks: { color: "#888" } } } }} />
              : <p className="text-silver/40 text-sm">No data yet</p>}
          </div>
        </div>
      </main>
    </div>
  );
}
