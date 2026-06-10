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
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs text-forest/80 px-2 py-0.5 rounded bg-forest/10">{item.category}</span>
                <button onClick={() => deleteItem(item.id)} className="text-red-400/60 hover:text-red-400 text-xs">×</button>
              </div>
              <p className="text-sm text-white font-medium mb-1">{item.question}</p>
              <p className="text-xs text-silver/60">{item.answer}</p>
            </div>
          ))}
          {items.length === 0 && <p className="text-xs text-silver/40 py-8 text-center">No FAQs yet.</p>}
        </div>
      </main>
    </div>
  );
}
