"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Button from "@/components/ui/Button";

export default function AdminProductsPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [filterCat, setFilterCat] = useState("all");
  const [fetchError, setFetchError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    supabase?.from("product_categories").select("*").order("sort_order").then(({ data, error }: { data: any[] | null; error: any }) => {
      if (error) console.error("Categories fetch error:", error);
      setCategories(data || []);
    });
  }, []);

  function fetchProducts(catFilter: string) {
    if (!supabase) { setFetchError("Supabase client unavailable"); return; }
    setFetchError("");
    let query = supabase.from("products").select("*, category:product_categories(name, slug)").order("sort_order", { ascending: true }).order("created_at", { ascending: false });
    if (catFilter !== "all") query = query.eq("category_id", catFilter);
    query.then(({ data, error }: { data: any[] | null; error: any }) => {
      if (error) { console.error("Products fetch error:", error); setFetchError(error.message); }
      else { setProducts(data || []); setSelected(new Set()); }
    });
  }

  useEffect(() => { fetchProducts(filterCat); }, [filterCat]);

  function toggleSelect(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }

  function toggleSelectAll() {
    if (selected.size === products.length) { setSelected(new Set()); }
    else { setSelected(new Set(products.map((p) => p.id))); }
  }

  async function toggleActive(id: string, current: boolean) {
    if (!supabase) return;
    await supabase.from("products").update({ is_active: !current }).eq("id", id);
    fetchProducts(filterCat);
  }

  async function bulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selected.size} product(s) and ALL their translations, specs, and images?`)) return;
    setDeleting(true);
    const ids = Array.from(selected);
    if (!supabase) { setDeleting(false); return; }

    for (const id of ids) {
      // Delete translations
      await supabase.from("product_translations").delete().eq("product_id", id);
      // Delete specs
      await supabase.from("product_specs").delete().eq("product_id", id);
      // Delete product
      await supabase.from("products").delete().eq("id", id);
    }

    setDeleting(false);
    setSelected(new Set());
    fetchProducts(filterCat);
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-light tracking-wider text-white">
            Products <span className="text-sm text-silver/40 font-normal">({products.length})</span>
            {selected.size > 0 && <span className="text-xs text-silver/50 ml-3">{selected.size} selected</span>}
          </h1>
          <div className="flex gap-2 items-center">
            {selected.size > 0 && (
              <Button size="sm" onClick={bulkDelete} disabled={deleting}
                className="!bg-red-500/20 !text-red-400 !border-red-500/30 hover:!bg-red-500/30">
                {deleting ? "Deleting..." : `🗑 Delete (${selected.size})`}
              </Button>
            )}
            <Link href="/admin/products/bulk"><Button size="sm" variant="outline">📤 Bulk Import</Button></Link>
            <Link href="/admin/products/new"><Button size="sm">+ New Product</Button></Link>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button onClick={() => setFilterCat("all")}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${filterCat === "all" ? "bg-forest/20 text-forest border-forest/30" : "bg-transparent text-silver/50 border-silver/20 hover:text-white"}`}>All</button>
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setFilterCat(cat.id)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${filterCat === cat.id ? "bg-forest/20 text-forest border-forest/30" : "bg-transparent text-silver/50 border-silver/20 hover:text-white"}`}>{cat.name}</button>
          ))}
        </div>

        {fetchError && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl">
            <p className="text-xs text-red-400">⚠️ {fetchError}</p>
          </div>
        )}

        <div className="bg-deep-blue/30 border border-silver/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-silver/10 text-silver/50 text-xs uppercase tracking-wider">
              <th className="p-4 w-10">
                <input type="checkbox" checked={products.length > 0 && selected.size === products.length}
                  onChange={toggleSelectAll} className="w-4 h-4 accent-forest rounded" />
              </th>
              <th className="text-left p-4">Sort</th>
              <th className="text-left p-4">Model</th>
              <th className="text-left p-4">Category</th>
              <th className="text-left p-4">Energy</th>
              <th className="text-left p-4">Images</th>
              <th className="text-left p-4">Online</th>
              <th className="text-right p-4">Actions</th>
            </tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className={`border-b border-silver/5 hover:bg-white/5 ${!p.is_active ? "opacity-50" : ""}`}>
                  <td className="p-4">
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)}
                      className="w-4 h-4 accent-forest rounded" />
                  </td>
                  <td className="p-4 text-silver/40 text-xs">{p.sort_order || "—"}</td>
                  <td className="p-4 text-white">{p.model_number}</td>
                  <td className="p-4 text-silver/60">{p.category?.name || "—"}</td>
                  <td className="p-4 text-silver/60">{p.energy_rating || "—"}</td>
                  <td className="p-4 text-silver/60">{p.image_gallery?.length || p.images?.length || 0}</td>
                  <td className="p-4">
                    <button onClick={() => toggleActive(p.id, p.is_active)}
                      className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                        p.is_active
                          ? "bg-forest/20 text-forest border-forest/30"
                          : "bg-deep-dark text-silver/40 border-silver/20"
                      }`}>
                      {p.is_active ? "ON" : "OFF"}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/admin/products/${p.id}/edit`} className="text-forest hover:text-forest/80 text-xs tracking-wider mr-3">Edit</Link>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={8} className="p-12 text-center text-xs text-silver/40">No products found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
