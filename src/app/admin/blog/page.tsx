"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Button from "@/components/ui/Button";

export default function AdminBlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [locale, setLocale] = useState("en");

  function load() {
    fetch(`/api/blog?locale=${locale}&all=true`).then((r) => r.json()).then((data) => setPosts(data.posts || []));
  }

  useEffect(() => { load(); }, [locale]);

  async function deletePost(id: string) {
    if (!confirm("Delete this post?")) return;
    await fetch(`/api/blog?id=${id}`, { method: "DELETE" });
    load();
  }

  function togglePublished(post: any) {
    fetch("/api/blog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: post.id, published: !post.published }),
    }).then(load);
  }

  async function movePost(id: string, dir: -1 | 1) {
    const idx = posts.findIndex((p) => p.id === id);
    const target = idx + dir;
    if (target < 0 || target >= posts.length) return;
    const a = posts[idx];
    const b = posts[target];
    // Swap sort_order values
    await fetch("/api/blog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: a.id, sort_order: b.sort_order }),
    });
    await fetch("/api/blog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: b.id, sort_order: a.sort_order }),
    });
    load();
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-light tracking-wider text-white">📝 Blog</h1>
          <div className="flex gap-2">
            {(["en", "zh"] as const).map((l) => (
              <button key={l} onClick={() => setLocale(l)}
                className={`px-3 py-1.5 text-xs rounded border ${locale === l ? "bg-forest/20 text-forest border-forest/30" : "text-silver/50 border-silver/20"}`}>
                {l === "en" ? "🇬🇧 EN" : "🇨🇳 ZH"}
              </button>
            ))}
            <Button size="sm" onClick={() => router.push("/admin/blog/new/edit")}>+ New Post</Button>
          </div>
        </div>

        <div className="bg-deep-blue/30 border border-silver/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-silver/10 text-silver/50 text-xs uppercase tracking-wider">
                <th className="text-left p-4 w-16">Order</th>
                <th className="text-left p-4">Title</th>
                <th className="text-left p-4 w-24">Status</th>
                <th className="text-left p-4 w-20">Locale</th>
                <th className="text-left p-4 w-32">Date</th>
                <th className="text-right p-4 w-52">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post, i) => (
                <tr key={post.id} className="border-b border-silver/5 hover:bg-white/5">
                  <td className="p-4 text-silver/50 text-xs">{post.sort_order || i + 1}</td>
                  <td className="p-4 text-white">{post.title}</td>
                  <td className="p-4">
                    <button onClick={() => togglePublished(post)}
                      className={`text-xs px-2 py-1 rounded ${post.published ? "bg-forest/20 text-forest" : "bg-silver/10 text-silver/40"}`}>
                      {post.published ? "Published" : "Draft"}
                    </button>
                  </td>
                  <td className="p-4"><span className="text-xs text-silver/50">{post.locale}</span></td>
                  <td className="p-4 text-silver/60 text-xs">{(post.created_at || "").slice(0, 10)}</td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <button onClick={() => movePost(post.id, -1)} disabled={i === 0}
                      className={`text-xs px-1 ${i === 0 ? "text-silver/20 cursor-not-allowed" : "text-silver/40 hover:text-white"}`}>↑</button>
                    <button onClick={() => movePost(post.id, 1)} disabled={i === posts.length - 1}
                      className={`text-xs px-1 ${i === posts.length - 1 ? "text-silver/20 cursor-not-allowed" : "text-silver/40 hover:text-white"}`}>↓</button>
                    <button onClick={() => router.push(`/admin/blog/${post.id}/edit`)}
                      className="text-ice/60 hover:text-ice text-xs ml-2 mr-3">✏️</button>
                    <button onClick={() => deletePost(post.id)}
                      className="text-red-400/60 hover:text-red-400 text-xs">🗑</button>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-xs text-silver/40">No posts yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
