"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Button from "@/components/ui/Button";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newType, setNewType] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editVals, setEditVals] = useState<Record<string, string>>({});
  const supabase = createClient();

  function loadCategories() {
    supabase?.from("product_categories").select("*").order("product_type").order("sort_order").then(({ data }: { data: any[] | null }) => setCategories(data || []));
  }

  useEffect(() => {
    loadCategories();
    fetch("/api/product-types").then(r => r.json()).then(data => {
      const names = (data.types || []).map((t: any) => t.name);
      setProductTypes(names);
      if (names.length > 0) setNewType(names[0]);
    });
  }, []);

  async function addCategory() {
    if (!newName || !newSlug) return;
    await supabase?.from("product_categories").insert({ name: newName, slug: newSlug, sort_order: categories.length + 1, product_type: newType });
    setNewName(""); setNewSlug(""); if (productTypes.length > 0) setNewType(productTypes[0]);
    loadCategories();
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete this category? Products in this category won't be deleted.")) return;
    if (!supabase) return;
    await supabase.from("product_categories").delete().eq("id", id);
    loadCategories();
  }

  function startEdit(cat: any) {
    setEditing(cat.id);
    setEditVals({ name: cat.name, slug: cat.slug, product_type: cat.product_type, sort_order: String(cat.sort_order) });
  }

  async function saveEdit(id: string) {
    if (!supabase) return;
    await supabase.from("product_categories").update({
      name: editVals.name,
      slug: editVals.slug,
      product_type: editVals.product_type,
      sort_order: parseInt(editVals.sort_order) || 0,
    }).eq("id", id);
    setEditing(null);
    loadCategories();
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="ml-64 flex-1 p-8">
        <h1 className="text-2xl font-light tracking-wider text-white mb-8">Categories</h1>

        <div className="flex gap-3 mb-8 flex-wrap">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" className="bg-deep-dark border border-silver/10 rounded-lg px-4 py-2 text-sm text-white w-40" />
          <input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="slug" className="bg-deep-dark border border-silver/10 rounded-lg px-4 py-2 text-sm text-white w-28" />
          <select value={newType} onChange={(e) => setNewType(e.target.value)}
            className="bg-deep-dark border border-silver/10 rounded-lg px-4 py-2 text-sm text-white w-36">
            {productTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <Button size="sm" onClick={addCategory}>+ Add</Button>
        </div>

        <div className="bg-deep-blue/30 border border-silver/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-silver/10 text-silver/50 text-xs uppercase tracking-wider">
              <th className="text-left p-4">Sort</th><th className="text-left p-4">Name</th><th className="text-left p-4">Slug</th><th className="text-left p-4">Product Type</th><th className="text-left p-4">UUID</th><th className="text-right p-4 w-40">Actions</th>
            </tr></thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b border-silver/5 hover:bg-white/5">
                  {editing === cat.id ? (
                    <>
                      <td className="p-2">
                        <input value={editVals.sort_order || ""} onChange={(e) => setEditVals({ ...editVals, sort_order: e.target.value })}
                          className="w-14 bg-deep-dark border border-silver/10 rounded px-2 py-1.5 text-xs text-white text-center" />
                      </td>
                      <td className="p-2">
                        <input value={editVals.name || ""} onChange={(e) => setEditVals({ ...editVals, name: e.target.value })}
                          className="w-full bg-deep-dark border border-silver/10 rounded px-2 py-1.5 text-xs text-white" />
                      </td>
                      <td className="p-2">
                        <input value={editVals.slug || ""} onChange={(e) => setEditVals({ ...editVals, slug: e.target.value })}
                          className="w-full bg-deep-dark border border-silver/10 rounded px-2 py-1.5 text-xs text-white font-mono" />
                      </td>
                      <td className="p-2">
                        <select value={editVals.product_type || ""} onChange={(e) => setEditVals({ ...editVals, product_type: e.target.value })}
                          className="w-full bg-deep-dark border border-silver/10 rounded px-2 py-1.5 text-xs text-white">
                          {productTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </td>
                      <td className="p-2 text-xs text-silver/40 font-mono">{cat.id.slice(0, 8)}…</td>
                      <td className="p-2 text-right">
                        <button onClick={() => saveEdit(cat.id)} className="text-forest hover:text-forest/80 text-xs px-2">💾</button>
                        <button onClick={() => setEditing(null)} className="text-silver/40 hover:text-white text-xs px-2">✕</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-4 text-silver/60 text-xs">{cat.sort_order}</td>
                      <td className="p-4 text-white">{cat.name}</td>
                      <td className="p-4 text-silver/60 font-mono text-xs">{cat.slug}</td>
                      <td className="p-4">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-forest/15 text-forest/80">{cat.product_type}</span>
                      </td>
                      <td className="p-4">
                        <button onClick={() => { navigator.clipboard.writeText(cat.id); }}
                          className="text-[10px] font-mono text-ice/70 hover:text-ice bg-ice/10 hover:bg-ice/20 px-2 py-1 rounded transition-all"
                          title="Copy UUID">{cat.id.slice(0, 8)}… 📋</button>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <button onClick={() => startEdit(cat)} className="text-forest hover:text-forest/80 text-xs mr-3">Edit</button>
                        <button onClick={() => deleteCategory(cat.id)} className="text-red-400/60 hover:text-red-400 text-xs">🗑</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
