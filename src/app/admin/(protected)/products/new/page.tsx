"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Button from "@/components/ui/Button";

export default function NewProductPage() {
  const router = useRouter();
  const supabase = createClient();
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({ model_number: "", energy_rating: "", category_id: "", sort_order: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase?.from("product_categories").select("*").order("sort_order").then(({ data }: { data: any[] | null }) => setCategories(data || []));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true);
    if (!supabase) return;
    const sb = createClient();
    if (!sb) return;
    const { data: newProd, error } = await sb.from("products").insert({
      model_number: form.model_number,
      energy_rating: form.energy_rating || null,
      category_id: form.category_id || null,
      sort_order: form.sort_order || 0,
      specifications: {},
      image_gallery: [],
    }).select("id").single();

    if (error) { alert("Error: " + error.message); setSaving(false); return; }

    if (newProd) {
      const model = form.model_number;
      const slugBase = model.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      // Auto-create EN/ZH translations
      await sb.from("product_translations").insert([
        { product_id: newProd.id, locale: "en", slug: slugBase + "-wine-cooler", name: model + " Wine Cooler", description: "" },
        { product_id: newProd.id, locale: "zh", slug: slugBase + "-wine-cooler-cn", name: model + " 恒温酒柜", description: "" },
      ]);
    }

    router.push("/admin/products");
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="ml-64 flex-1 p-8">
        <h1 className="text-2xl font-light tracking-wider text-white mb-8">New Product</h1>
        <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
          <input value={form.model_number} onChange={(e) => setForm({ ...form, model_number: e.target.value })} required placeholder="Model Number *" className="w-full bg-deep-dark border border-silver/10 rounded-lg px-4 py-3 text-sm text-white placeholder-silver/30" />
          <input value={form.energy_rating} onChange={(e) => setForm({ ...form, energy_rating: e.target.value })} placeholder="Energy Rating" className="w-full bg-deep-dark border border-silver/10 rounded-lg px-4 py-3 text-sm text-white placeholder-silver/30" />
          <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            className="w-full bg-deep-dark border border-silver/10 rounded-lg px-4 py-3 text-sm text-white">
            <option value="">Select Category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
            placeholder="Sort Order" className="w-full bg-deep-dark border border-silver/10 rounded-lg px-4 py-3 text-sm text-white placeholder-silver/30" />
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Create Product"}</Button>
        </form>
      </main>
    </div>
  );
}
