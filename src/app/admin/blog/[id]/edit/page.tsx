"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Button from "@/components/ui/Button";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { compressImage } from "@/lib/image/compress";

export default function AdminBlogEditPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params?.id === "new";
  const [form, setForm] = useState({ title: "", slug: "", excerpt: "", author: "", cover_image: "", locale: "en", published: false });
  const [content, setContent] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const imgRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isNew) return;
    fetch(`/api/blog?locale=en&slug=${params.id}`).then((r) => r.json()).then((data) => {
      const p = data.post;
      if (p) {
        setForm({ title: p.title, slug: p.slug, excerpt: p.excerpt || "", author: p.author || "", cover_image: p.cover_image || "", locale: p.locale || "en", published: p.published });
        setContent(p.content || null);
      }
      setLoading(false);
    });
  }, [params.id]);

  const saveContent = useCallback(async (c: any) => {
    setContent(c);
  }, []);

  async function handleSave() {
    if (!form.title || !form.slug) return;
    setSaving(true);
    const body = { ...form, content: content || { blocks: [] } };

    if (isNew) {
      const res = await fetch("/api/blog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.error) { alert(data.error); setSaving(false); return; }
      router.push(`/admin/blog/${data.id}/edit`);
    } else {
      await fetch("/api/blog", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, id: params.id }) });
    }
    setSaving(false);
  }

  async function handleImageUpload() {
    const file = imgRef.current?.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 1200, 0.85);
      const path = `blog/${Date.now()}.webp`;
      const fd = new FormData();
      fd.append("file", compressed, `${path}.webp`);
      fd.append("path", path);
      fd.append("bucket", "products");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const result = await res.json();
      if (result.url) setForm({ ...form, cover_image: result.url });
    } catch (e: any) { alert(e.message); }
    if (imgRef.current) imgRef.current.value = "";
  }

  if (loading) return (
    <div className="flex"><AdminSidebar /><main className="ml-64 flex-1 p-8"><p className="text-silver/40">Loading...</p></main></div>
  );

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="ml-64 flex-1 p-8">
        <h1 className="text-2xl font-light tracking-wider text-white mb-8">{isNew ? "New Blog Post" : "Edit Blog Post"}</h1>

        <div className="max-w-3xl space-y-6">
          {/* Title */}
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: isNew ? e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") : form.slug })}
            placeholder="Post Title" className="w-full bg-deep-dark border border-silver/10 rounded-lg px-4 py-3 text-xl text-white font-light tracking-wide" />

          {/* Slug + Locale + Published */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-silver/50">URL:</span>
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") })}
              placeholder="blog-post-url-slug" className="flex-1 bg-deep-dark border border-silver/10 rounded-lg px-4 py-2 text-sm text-white font-mono min-w-[200px]" />
<span className="text-xs text-silver/40">/blog/</span>
            <select value={form.locale} onChange={(e) => setForm({ ...form, locale: e.target.value })}
              className="bg-deep-dark border border-silver/10 rounded-lg px-3 py-2 text-sm text-white">
              <option value="en">🇬🇧 English</option><option value="zh">🇨🇳 Chinese</option>
            </select>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })}
                className="w-4 h-4 rounded accent-forest" />
              <span className="text-sm text-silver/60">Published</span>
            </label>
          </div>

          {/* Author */}
          <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })}
            placeholder="Author" className="w-full bg-deep-dark border border-silver/10 rounded-lg px-4 py-2 text-sm text-white" />

          {/* Cover image */}
          <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
            <h3 className="text-white tracking-wide mb-3">🖼 Cover Image</h3>
            {form.cover_image && (
              <div className="mb-3 rounded-lg overflow-hidden border border-silver/10">
                <img src={form.cover_image} alt="" className="w-full max-h-48 object-cover" />
              </div>
            )}
            <div className="flex gap-2">
              <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              <Button size="sm" variant="outline" onClick={() => imgRef.current?.click()}>📁 Upload</Button>
              <input value={form.cover_image} onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
                placeholder="Or paste image URL" className="flex-1 bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white font-mono" />
            </div>
          </div>

          {/* Excerpt */}
          <textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2}
            placeholder="Short excerpt / summary for blog listing"
            className="w-full bg-deep-dark border border-silver/10 rounded-lg px-4 py-3 text-sm text-white" />

          {/* Rich Content */}
          <div className="bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
            <h3 className="text-white tracking-wide mb-4">📝 Content</h3>
            <RichTextEditor content={content} onSave={saveContent} />
          </div>

          {/* Save */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "💾 Save Post"}</Button>
            <Button variant="outline" onClick={() => router.push("/admin/blog")}>Cancel</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
