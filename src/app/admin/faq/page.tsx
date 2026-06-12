"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Button from "@/components/ui/Button";

const CATEGORIES = ["Product", "Installation", "Warranty", "Shipping", "General"];

export default function AdminFaqPage() {
  const supabase = createClient();
  const [items, setItems] = useState<any[]>([]);
  const [locale, setLocale] = useState("en");
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [editing, setEditing] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [editCategory, setEditCategory] = useState("General");

  function loadFaq() {
    fetch(`/api/faq?locale=${locale}`)
      .then((r) => r.json())
      .then((data) => setItems(data.items || []));
  }

  useEffect(() => { loadFaq(); }, [locale]);

  async function addItem() {
    if (!newQuestion || !newAnswer || !supabase) return;
    await supabase.from("faq_items").insert({
      locale, question: newQuestion, answer: newAnswer,
      category: newCategory, sort_order: items.length + 1,
    });
    setNewQuestion(""); setNewAnswer(""); setNewCategory("General");
    loadFaq();
  }

  async function deleteItem(id: string) {
    if (!supabase) return;
    await supabase.from("faq_items").delete().eq("id", id);
    loadFaq();
  }

  function startEdit(item: any) {
    setEditing(item.id);
    setEditQuestion(item.question);
    setEditAnswer(item.answer);
    setEditCategory(item.category);
  }

  async function saveEdit(id: string) {
    if (!editQuestion || !editAnswer || !supabase) return;
    await fetch("/api/faq", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, question: editQuestion, answer: editAnswer, category: editCategory }),
    });
    setEditing(null);
    loadFaq();
  }

  function cancelEdit() {
    setEditing(null);
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="ml-64 flex-1 p-8">
        <h1 className="text-2xl font-light tracking-wider text-white mb-8">📋 FAQ Manager</h1>

        {/* Locale toggle */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setLocale("en")}
            className={`px-3 py-1.5 text-xs rounded border ${locale === "en" ? "bg-ice/20 text-ice border-ice/30" : "text-silver/50 border-silver/20"}`}>🇬🇧 EN</button>
          <button onClick={() => setLocale("zh")}
            className={`px-3 py-1.5 text-xs rounded border ${locale === "zh" ? "bg-ice/20 text-ice border-ice/30" : "text-silver/50 border-silver/20"}`}>🇨🇳 ZH</button>
        </div>

        {/* Add new */}
        <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-4 mb-6 space-y-2">
          <input value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Question" className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white" />
          <textarea value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} rows={3}
            placeholder="Answer" className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white" />
          <div className="flex gap-2">
            <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
              className="bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-silver/60">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <Button size="sm" onClick={addItem}>+ Add</Button>
          </div>
        </div>

        {/* List */}
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="bg-deep-blue/30 border border-silver/10 rounded-xl p-4">
              {editing === item.id ? (
                /* ── Edit Mode ── */
                <div className="space-y-2">
                  <input value={editQuestion} onChange={(e) => setEditQuestion(e.target.value)}
                    placeholder="Question"
                    className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white" />
                  <textarea value={editAnswer} onChange={(e) => setEditAnswer(e.target.value)} rows={3}
                    placeholder="Answer"
                    className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white" />
                  <div className="flex gap-2 items-center">
                    <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)}
                      className="bg-deep-dark border border-silver/10 rounded px-3 py-1.5 text-sm text-silver/60">
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button onClick={() => saveEdit(item.id)} className="text-forest hover:text-forest/80 text-xs px-2 py-1 border border-forest/30 rounded">💾 Save</button>
                    <button onClick={cancelEdit} className="text-silver/40 hover:text-white text-xs">✕ Cancel</button>
                  </div>
                </div>
              ) : (
                /* ── Display Mode ── */
                <>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs text-forest/80 px-2 py-0.5 rounded bg-forest/10">{item.category}</span>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => startEdit(item)} className="text-ice/60 hover:text-ice text-xs">✏️ Edit</button>
                      <button onClick={() => deleteItem(item.id)} className="text-red-400/60 hover:text-red-400 text-xs">🗑</button>
                    </div>
                  </div>
                  <p className="text-sm text-white font-medium mb-1">{item.question}</p>
                  <p className="text-xs text-silver/60 whitespace-pre-line">{item.answer}</p>
                </>
              )}
            </div>
          ))}
          {items.length === 0 && <p className="text-xs text-silver/40 py-8 text-center">No FAQs yet.</p>}
        </div>
      </main>
    </div>
  );
}
