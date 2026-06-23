"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ views: 0, inquiries: 0, products: 0 });
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    async function load() {
      const [views, inquiries, products] = await Promise.all([
        supabase.from("page_views").select("id", { count: "exact", head: true }),
        supabase.from("inquiries").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }),
      ]);
      setStats({ views: views.count || 0, inquiries: inquiries.count || 0, products: products.count || 0 });
    }
    load();
  }, []);
  return (
    <div className="flex">
      <AdminSidebar />
      <main className="ml-64 flex-1 p-8">
        <h1 className="text-2xl font-light tracking-wider text-white mb-8">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
            <p className="text-xs text-silver/50 uppercase tracking-wider">Total Views</p>
            <p className="text-3xl font-light text-ice mt-2">{stats.views}</p>
          </div>
          <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
            <p className="text-xs text-silver/50 uppercase tracking-wider">Total Inquiries</p>
            <p className="text-3xl font-light text-forest mt-2">{stats.inquiries}</p>
          </div>
          <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
            <p className="text-xs text-silver/50 uppercase tracking-wider">Products</p>
            <p className="text-3xl font-light text-silver mt-2">{stats.products}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
