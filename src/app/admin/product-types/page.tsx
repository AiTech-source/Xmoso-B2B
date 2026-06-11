"use client";
import { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Button from "@/components/ui/Button";

export default function AdminProductTypesPage() {
  const [types, setTypes] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  function loadTypes() {
    fetch("/api/product-types").then(r => r.json()).then(data => setTypes(data.types || []));
  }

  useEffect(() => { loadTypes(); }, []);

  async function addType() {
    if (!newName) return;
    await fetch("/api/product-types", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newName }),
    });
    setNewName("");
    loadTypes();
  }

  async function deleteType(id: string) {
    if (!confirm("Delete this product type? Categories using it won't be deleted.")) return;
    await fetch(`/api/product-types?id=${id}`, { method: "DELETE" });
    loadTypes();
  }

  async function saveEdit(id: string) {
    if (!editName) return;
    await fetch("/api/product-types", {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, name: editName }),
    });
    setEditing(null);
    loadTypes();
  }

  async function moveType(id: string, dir: -1 | 1) {
    const idx = types.findIndex(t => t.id === id);
    const target = idx + dir;
    if (target < 0 || target >= types.length) return;
    const a = types[idx], b = types[target];
    await fetch("/api/product-types", {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: a.id, sort_order: b.sort_order }),
    });
    await fetch("/api/product-types", {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: b.id, sort_order: a.sort_order }),
    });
    loadTypes();
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="ml-64 flex-1 p-8">
        <h1 className="text-2xl font-light tracking-wider text-white mb-8">📦 Product Types</h1>

        <div className="flex gap-3 mb-6">
          <input value={newName} onChange={(e) => setNewName(e.target.value)}
            placeholder="New product type (e.g. Bar Cabinet With Cooler)"
            className="bg-deep-dark border border-silver/10 rounded-lg px-4 py-2 text-sm text-white flex-1" />
          <Button size="sm" onClick={addType}>+ Add</Button>
        </div>

        <div className="bg-deep-blue/30 border border-silver/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-silver/10 text-silver/50 text-xs uppercase tracking-wider">
              <th className="text-left p-4 w-24">Sort</th><th className="text-left p-4">Name</th><th className="text-right p-4 w-40">Actions</th>
            </tr></thead>
            <tbody>
              {types.map((t, i) => (
                <tr key={t.id} className="border-b border-silver/5 hover:bg-white/5">
                  <td className="p-4 text-silver/40 text-xs">
                    <button onClick={() => moveType(t.id, -1)} className="text-silver/40 hover:text-white text-xs px-1">↑</button>
                    <button onClick={() => moveType(t.id, 1)} className="text-silver/40 hover:text-white text-xs px-1">↓</button>
                    <span className="ml-2">{t.sort_order}</span>
                  </td>
                  <td className="p-4">
                    {editing === t.id ? (
                      <input value={editName} onChange={(e) => setEditName(e.target.value)}
                        className="bg-deep-dark border border-silver/10 rounded px-2 py-1 text-xs text-white w-full" />
                    ) : (
                      <span className="text-white">{t.name}</span>
                    )}
                  </td>
                  <td className="p-4 text-right whitespace-nowrap">
                    {editing === t.id ? (
                      <>
                        <button onClick={() => saveEdit(t.id)} className="text-forest hover:text-forest/80 text-xs px-2">💾 Save</button>
                        <button onClick={() => setEditing(null)} className="text-silver/40 hover:text-white text-xs">✕</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditing(t.id); setEditName(t.name); }} className="text-forest hover:text-forest/80 text-xs mr-3">Edit</button>
                        <button onClick={() => deleteType(t.id)} className="text-red-400/60 hover:text-red-400 text-xs">🗑</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
