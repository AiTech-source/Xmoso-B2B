"use client";
import { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Button from "@/components/ui/Button";

interface KnowledgeItem {
  id: string;
  category: string;
  title: string;
  content: string;
  created_at: string;
}

const CATEGORIES = ["制冷", "风道", "材质", "结构", "节能"];

export default function AdminKnowledgePage() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<KnowledgeItem | null>(null);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/knowledge");
    const data = await res.json();
    setItems(data.knowledge || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function startEdit(item: KnowledgeItem) {
    setEditing(item);
    setCategory(item.category);
    setTitle(item.title);
    setContent(item.content);
  }

  function resetForm() {
    setEditing(null);
    setCategory(CATEGORIES[0]);
    setTitle("");
    setContent("");
  }

  async function save() {
    if (!title.trim() || !content.trim()) return alert("Title and content required");
    setSaving(true);
    const body = editing
      ? { id: editing.id, category, title, content }
      : { category, title, content };
    const res = await fetch("/api/knowledge", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await res.json();
    if (result.error) { alert(result.error); setSaving(false); return; }
    resetForm();
    await load();
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm("Delete this knowledge entry?")) return;
    setDeleting(id);
    await fetch(`/api/knowledge?id=${id}`, { method: "DELETE" });
    await load();
    setDeleting(null);
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="ml-64 flex-1 p-8">
        <h1 className="text-2xl font-light tracking-wider text-white mb-2">📚 Knowledge Base</h1>
        <p className="text-sm text-silver/50 mb-8">
          Store your product technical data here. The AI SEO pipeline retrieves this content via RAG (vector search) when generating articles.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 bg-deep-blue/30 border border-silver/10 rounded-xl p-6 h-fit">
            <h2 className="text-white text-sm font-medium mb-4">{editing ? "✏️ Edit" : "➕ Add"} Knowledge</h2>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-silver/50 mb-1">Category</p>
                <select value={category} onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs text-silver/50 mb-1">Title</p>
                <input value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Compressor Efficiency at Partial Load"
                  className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <p className="text-xs text-silver/50 mb-1">Content (technical details, parameters, measurements)</p>
                <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8}
                  placeholder="Include specific engineering parameters, physical quantities, and standards..."
                  className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white font-mono" />
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={save} disabled={saving}>
                  {saving ? "Saving..." : editing ? "💾 Update" : "➕ Add Entry"}
                </Button>
                {editing && (
                  <Button variant="outline" onClick={resetForm}>Cancel</Button>
                )}
              </div>
            </div>
          </div>

          {/* List */}
          <div className="lg:col-span-3">
            {loading ? (
              <p className="text-silver/40 text-sm">Loading...</p>
            ) : items.length === 0 ? (
              <div className="text-center py-12 text-silver/40 text-sm">
                No knowledge entries yet. Add your first technical data point.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id}
                    className="bg-deep-blue/20 border border-silver/10 rounded-xl p-5 hover:border-forest/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-forest/10 text-forest uppercase tracking-wider">
                            {item.category}
                          </span>
                        </div>
                        <h3 className="text-white text-sm font-medium">{item.title}</h3>
                        <p className="text-silver/50 text-xs mt-1 line-clamp-2">{item.content}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => startEdit(item)}
                          className="text-xs text-silver/40 hover:text-white transition-colors">Edit</button>
                        <button onClick={() => remove(item.id)} disabled={deleting === item.id}
                          className="text-xs text-red-400/60 hover:text-red-400 transition-colors">
                          {deleting === item.id ? "..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
