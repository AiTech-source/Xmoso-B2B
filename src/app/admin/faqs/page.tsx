"use client";
import { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [filterType, setFilterType] = useState("");
  const [locale, setLocale] = useState("en");
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ question: "", answer: "", product_type: "", locale: "en", sort_order: "0" });

  function loadFaqs() {
    const params = new URLSearchParams({ locale });
    if (filterType) params.set("product_type", filterType);
    fetch(`/api/faqs?${params}`)
      .then((r) => r.json())
      .then((data) => setFaqs(data.faqs || []));
  }

  useEffect(() => {
    fetch("/api/product-types")
      .then((r) => r.json())
      .then((d) => setProductTypes((d.types || []).map((t: any) => t.name)));
  }, []);

  useEffect(() => { loadFaqs(); }, [filterType, locale]);

  function startEdit(faq: any) {
    setEditing(faq.id);
    setForm({
      question: faq.question,
      answer: faq.answer,
      product_type: faq.product_type || "",
      locale: faq.locale,
      sort_order: String(faq.sort_order || 0),
    });
  }

  function resetForm() {
    setEditing(null);
    setForm({ question: "", answer: "", product_type: filterType || "", locale, sort_order: "0" });
  }

  async function save() {
    if (!form.question || !form.answer) return;
    const body = {
      ...(editing ? { id: editing } : {}),
      question: form.question,
      answer: form.answer,
      product_type: form.product_type,
      locale: form.locale,
      sort_order: parseInt(form.sort_order) || 0,
    };
    const res = await fetch("/api/faqs", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) { resetForm(); loadFaqs(); }
  }

  async function deleteFaq(id: string) {
    if (!confirm("Delete this FAQ?")) return;
    await fetch(`/api/faqs?id=${id}`, { method: "DELETE" });
    loadFaqs();
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-light tracking-wider text-white">Product FAQs</h1>
          <span className="text-xs text-silver/40">Total: {faqs.length}</span>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setForm((f) => ({ ...f, product_type: e.target.value })); }}
            className="bg-deep-dark border border-silver/10 rounded-lg px-4 py-2 text-sm text-white">
            <option value="">All (Generic+Types)</option>
            {productTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={locale} onChange={(e) => setLocale(e.target.value)}
            className="bg-deep-dark border border-silver/10 rounded-lg px-4 py-2 text-sm text-white">
            <option value="en">English</option>
            <option value="zh">中文</option>
          </select>
          <button onClick={resetForm}
            className="px-4 py-2 text-sm rounded-lg border border-forest/30 text-forest hover:bg-forest/10 transition-colors">
            + New FAQ
          </button>
        </div>

        {/* Editor */}
        {(editing || form.question || form.answer) && (
          <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6 mb-6 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <input value={form.product_type} onChange={(e) => setForm({ ...form, product_type: e.target.value })}
                placeholder="Product type (leave blank = generic)" className="bg-deep-dark border border-silver/10 rounded px-3 py-2 text-xs text-white" />
              <select value={form.locale} onChange={(e) => setForm({ ...form, locale: e.target.value })}
                className="bg-deep-dark border border-silver/10 rounded px-3 py-2 text-xs text-white">
                <option value="en">English</option>
                <option value="zh">中文</option>
              </select>
              <input value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                type="number" placeholder="Sort" className="bg-deep-dark border border-silver/10 rounded px-3 py-2 text-xs text-white w-20" />
            </div>
            <input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })}
              placeholder="Question" className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white" />
            <textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })}
              placeholder="Answer" rows={4} className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white resize-y" />
            <div className="flex gap-2">
              <button onClick={save}
                className="px-4 py-2 text-sm rounded-lg bg-forest/20 text-forest border border-forest/30 hover:bg-forest/30 transition-colors">
                {editing ? "Update" : "Create"}
              </button>
              <button onClick={resetForm}
                className="px-4 py-2 text-sm rounded-lg bg-transparent text-silver/50 border border-silver/20 hover:text-white transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* FAQ List */}
        {faqs.length === 0 ? (
          <div className="bg-deep-blue/20 border border-silver/10 rounded-xl p-12 text-center">
            <p className="text-silver/40 text-sm">No FAQs yet. Create your first one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.id} className="bg-deep-blue/30 border border-silver/10 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {faq.product_type ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-forest/15 text-forest/80">{faq.product_type}</span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-ice/15 text-ice/80">Generic</span>
                      )}
                      <span className="text-[10px] text-silver/40">{faq.locale}</span>
                      <span className="text-[10px] text-silver/40">sort: {faq.sort_order}</span>
                    </div>
                    <p className="text-white text-sm font-medium">{faq.question}</p>
                    <p className="text-silver/50 text-xs mt-1 line-clamp-2">{faq.answer}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => startEdit(faq)} className="text-forest hover:text-forest/80 text-xs px-2 py-1">Edit</button>
                    <button onClick={() => deleteFaq(faq.id)} className="text-red-400/60 hover:text-red-400 text-xs px-2 py-1">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
