"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Button from "@/components/ui/Button";

interface Article { id: string; slug: string; title: string; keyword: string; status: string; created_at: string; }
interface BacklogItem {
  id?: string;
  keyword?: string;
  slug?: string | null;
  locale: string;
  content_type: string;
  source?: string;
  intent?: string;
  priority: number;
  status: string;
  generated_path?: string;
  last_error?: string;
  created_at?: string;
}

type Tab = "articles" | "backlog" | "generate" | "faq" | "blog" | "gsc";

const TABS: Tab[] = ["articles", "backlog", "generate", "faq", "blog", "gsc"];
const TAB_LABELS: Record<Tab, string> = {
  articles: "📋 Articles",
  backlog: "🧭 Keyword Backlog",
  generate: "🔬 Insight",
  faq: "❓ FAQ",
  blog: "📝 Blog",
  gsc: "📈 SEO Analytics",
};

export default function AdminSeoPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("articles");

  // Insight
  const [keyword, setKeyword] = useState("");
  const [slug, setSlug] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<any>(null);
  const [genError, setGenError] = useState("");

  // FAQ
  const [faqProductType, setFaqProductType] = useState("");
  const [faqLocale, setFaqLocale] = useState("en");
  const [faqGenerating, setFaqGenerating] = useState(false);
  const [faqResult, setFaqResult] = useState<any>(null);

  // Blog
  const [blogKeyword, setBlogKeyword] = useState("");
  const [blogSlug, setBlogSlug] = useState("");
  const [blogGenerating, setBlogGenerating] = useState(false);
  const [blogResult, setBlogResult] = useState<any>(null);

  // Backlog
  const [backlog, setBacklog] = useState<BacklogItem[]>([]);
  const [backlogStatus, setBacklogStatus] = useState("new");
  const [backlogType, setBacklogType] = useState("");
  const [backlogKeyword, setBacklogKeyword] = useState("");
  const [backlogContentType, setBacklogContentType] = useState("blog");
  const [backlogPriority, setBacklogPriority] = useState(70);
  const [backlogLoading, setBacklogLoading] = useState(false);
  const [backlogResult, setBacklogResult] = useState<any>(null);

  // GSC
  const [gscData, setGscData] = useState<any>(null);
  const [gscLoading, setGscLoading] = useState(false);
  const [gscError, setGscError] = useState("");
  const [gscDays, setGscDays] = useState(28);

  async function loadArticles() {
    const res = await fetch("/api/seo/articles");
    setArticles((await res.json()).articles || []);
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadArticles(); }, []);

  function slugify(text: string) { return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|$/g, ""); }

  async function loadBacklog() {
    setBacklogLoading(true); setBacklogResult(null);
    try {
      const params = new URLSearchParams({ locale: "en" });
      if (backlogStatus) params.set("status", backlogStatus);
      if (backlogType) params.set("content_type", backlogType);
      const res = await fetch(`/api/seo/keyword-backlog?${params.toString()}`, { headers: { "x-api-key": "xmoso-seo-2026" } });
      const data = await res.json();
      if (data.error) setBacklogResult({ error: data.error });
      setBacklog(data.keywords || []);
    } catch (e: any) { setBacklogResult({ error: e.message }); }
    setBacklogLoading(false);
  }

  async function addBacklogKeyword() {
    if (!backlogKeyword.trim()) return alert("Keyword required");
    setBacklogLoading(true); setBacklogResult(null);
    try {
      const res = await fetch("/api/seo/keyword-backlog", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": "xmoso-seo-2026" },
        body: JSON.stringify({ keyword: backlogKeyword, content_type: backlogContentType, locale: "en", priority: backlogPriority }),
      });
      const data = await res.json();
      setBacklogResult(data.error ? { error: data.error } : { message: "Keyword added to backlog." });
      if (!data.error) {
        setBacklogKeyword("");
        await loadBacklog();
      }
    } catch (e: any) { setBacklogResult({ error: e.message }); }
    setBacklogLoading(false);
  }

  async function generateInsight() {
    if (!keyword.trim() || !slug.trim()) return alert("Keyword and slug required");
    setGenerating(true); setGenResult(null); setGenError("");
    try {
      const res = await fetch("/api/seo/generate", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": "xmoso-seo-2026" }, body: JSON.stringify({ keyword, slug }) });
      const data = await res.json();
      if (data.error) setGenError(data.error); else setGenResult(data.article);
      await loadArticles();
    } catch (e: any) { setGenError(e.message); }
    setGenerating(false);
  }

  async function generateFaqs() {
    if (!faqProductType.trim()) return alert("Product type required");
    setFaqGenerating(true); setFaqResult(null);
    try {
      const res = await fetch("/api/seo/generate-faqs", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": "xmoso-seo-2026" }, body: JSON.stringify({ product_type: faqProductType, locale: faqLocale }) });
      setFaqResult(await res.json());
    } catch (e: any) { setFaqResult({ error: e.message }); }
    setFaqGenerating(false);
  }

  async function generateBlog() {
    if (!blogKeyword.trim() || !blogSlug.trim()) return alert("Keyword and slug required");
    setBlogGenerating(true); setBlogResult(null);
    try {
      const res = await fetch("/api/seo/generate-blog", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": "xmoso-seo-2026" }, body: JSON.stringify({ keyword: blogKeyword, slug: blogSlug, locale: "en" }) });
      setBlogResult(await res.json());
      await loadArticles();
    } catch (e: any) { setBlogResult({ error: e.message }); }
    setBlogGenerating(false);
  }

  async function loadGsc() {
    setGscLoading(true); setGscError("");
    try {
      const res = await fetch(`/api/seo/gsc/query?days=${gscDays}&limit=30`);
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { setGscError("API returned non-JSON response. Check Vercel logs."); setGscLoading(false); return; }
      if (data.error) setGscError(data.error); else setGscData(data);
    } catch (e: any) { setGscError(e.message); }
    setGscLoading(false);
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="ml-64 flex-1 p-8">
        <h1 className="text-2xl font-light tracking-wider text-white mb-2">🤖 SEO Content Hub</h1>
        <p className="text-sm text-silver/50 mb-6">Generate content, manage FAQs, and track Google Search performance.</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 pb-4 border-b border-silver/10 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                tab === t ? "bg-forest/20 text-forest border border-forest/20" : "text-silver/60 hover:text-white"
              }`}>{TAB_LABELS[t]}</button>
          ))}
        </div>

        {/* === ARTICLES === */}
        {tab === "articles" && (
          <div className="space-y-3">
            {loading && <p className="text-silver/40 text-sm">Loading...</p>}
            {!loading && articles.length === 0 && <p className="text-silver/40 text-sm py-12 text-center">No articles yet.</p>}
            {articles.map((a) => (
              <div key={a.id} className="bg-deep-blue/20 border border-silver/10 rounded-xl p-5 hover:border-forest/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white text-sm font-medium truncate">{a.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-silver/40">
                      <span>{a.keyword}</span><span>·</span>
                      <span>{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <a href={`/insights/${a.slug}`} target="_blank" className="text-xs text-silver/40 hover:text-forest shrink-0">View →</a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* === KEYWORD BACKLOG === */}
        {tab === "backlog" && (
          <div className="space-y-6">
            <div className="max-w-3xl bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
              <h2 className="text-white text-sm font-medium mb-2">🧭 Keyword Backlog</h2>
              <p className="text-xs text-silver/50 mb-4">Cron pulls new blog and insight topics from this queue before generating content.</p>
              <div className="grid md:grid-cols-[1fr_150px_110px_auto] gap-3">
                <input value={backlogKeyword} onChange={(e) => setBacklogKeyword(e.target.value)}
                  placeholder="New keyword / topic" className="bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white" />
                <select value={backlogContentType} onChange={(e) => setBacklogContentType(e.target.value)}
                  className="bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white">
                  <option value="blog">Blog</option><option value="insight">Insight</option>
                </select>
                <input value={backlogPriority} onChange={(e) => setBacklogPriority(Number(e.target.value))}
                  type="number" min="1" max="100" className="bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white" />
                <Button onClick={addBacklogKeyword} disabled={backlogLoading}>{backlogLoading ? "Saving..." : "Add"}</Button>
              </div>
              {backlogResult && <p className={`text-xs mt-3 ${backlogResult.error ? "text-red-400" : "text-forest"}`}>{backlogResult.error || backlogResult.message}</p>}
            </div>

            <div className="flex items-center gap-3">
              <select value={backlogStatus} onChange={(e) => setBacklogStatus(e.target.value)}
                className="bg-deep-dark border border-silver/10 rounded px-3 py-2 text-xs text-white">
                <option value="new">New</option><option value="selected">Selected</option><option value="published">Published</option><option value="error">Error</option><option value="">All</option>
              </select>
              <select value={backlogType} onChange={(e) => setBacklogType(e.target.value)}
                className="bg-deep-dark border border-silver/10 rounded px-3 py-2 text-xs text-white">
                <option value="">All types</option><option value="blog">Blog</option><option value="insight">Insight</option>
              </select>
              <Button size="sm" onClick={loadBacklog} disabled={backlogLoading}>{backlogLoading ? "Loading..." : "Refresh"}</Button>
            </div>

            <div className="overflow-x-auto border border-silver/10 rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-deep-blue/40">
                    <th className="px-4 py-3 text-left text-xs text-silver/50 font-medium uppercase">Keyword</th>
                    <th className="px-4 py-3 text-left text-xs text-silver/50 font-medium uppercase">Type</th>
                    <th className="px-4 py-3 text-right text-xs text-silver/50 font-medium uppercase">Priority</th>
                    <th className="px-4 py-3 text-left text-xs text-silver/50 font-medium uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs text-silver/50 font-medium uppercase">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {backlog.map((item, i) => (
                    <tr key={item.id || `${item.keyword}-${i}`} className="border-t border-silver/5">
                      <td className="px-4 py-3 text-white text-xs max-w-[360px]">
                        <p className="truncate">{item.keyword}</p>
                        {item.last_error && <p className="text-red-400/80 mt-1 truncate">{item.last_error}</p>}
                      </td>
                      <td className="px-4 py-3 text-silver/70 text-xs">{item.content_type}</td>
                      <td className="px-4 py-3 text-right text-silver/70 text-xs">{item.priority}</td>
                      <td className="px-4 py-3 text-silver/70 text-xs">{item.status}</td>
                      <td className="px-4 py-3 text-xs">
                        {item.generated_path ? <a className="text-forest underline" href={item.generated_path} target="_blank">View</a> : <span className="text-silver/35">-</span>}
                      </td>
                    </tr>
                  ))}
                  {!backlogLoading && backlog.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-silver/40 text-xs">No backlog items for this filter.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* === GENERATE INSIGHT === */}
        {tab === "generate" && (
          <div className="max-w-xl bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
            <h2 className="text-white text-sm font-medium mb-4">🔬 Generate Engineering Insight (2K-15K words)</h2>
            <div className="space-y-3">
              <input value={keyword} onChange={(e) => setKeyword(e.target.value)} onBlur={() => setSlug(slugify(keyword))}
                placeholder="Keyword / Topic" className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white" />
              <input value={slug} onChange={(e) => setSlug(e.target.value)}
                placeholder="url-slug" className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white font-mono" />
              <Button onClick={generateInsight} disabled={generating}>{generating ? "⏳..." : "🤖 Generate Insight"}</Button>
              {genResult && <div className="p-4 bg-forest/10 border border-forest/20 rounded-lg"><p className="text-forest text-xs">✅ <a href={genResult.url} target="_blank" className="underline">View article</a></p></div>}
              {genError && <div className="p-4 bg-red-400/10 border border-red-400/20 rounded-lg"><p className="text-red-400 text-xs">❌ {genError}</p></div>}
            </div>
          </div>
        )}

        {/* === GENERATE FAQ === */}
        {tab === "faq" && (
          <div className="max-w-xl bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
            <h2 className="text-white text-sm font-medium mb-2">❓ AI-Generate Product FAQ</h2>
            <p className="text-xs text-silver/50 mb-4">Creates B2B FAQs (MOQ, certifications, lead time, etc.) and writes to product_faqs table.</p>
            <div className="space-y-3">
              <input value={faqProductType} onChange={(e) => setFaqProductType(e.target.value)} placeholder="Product Type (e.g. Wine Coolers)"
                className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white" />
              <select value={faqLocale} onChange={(e) => setFaqLocale(e.target.value)} className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white">
                <option value="en">English</option><option value="zh">Chinese</option>
              </select>
              <Button onClick={generateFaqs} disabled={faqGenerating}>{faqGenerating ? "⏳..." : "❓ Generate FAQs"}</Button>
              {faqResult && <div className={`p-4 border rounded-lg ${faqResult.error ? "bg-red-400/10 border-red-400/20" : "bg-forest/10 border-forest/20"}`}>
                <p className={`text-xs ${faqResult.error ? "text-red-400" : "text-forest"}`}>{faqResult.error || `✅ ${faqResult.count} FAQs for "${faqResult.product_type}"`}</p>
              </div>}
            </div>
          </div>
        )}

        {/* === GENERATE BLOG === */}
        {tab === "blog" && (
          <div className="max-w-xl bg-deep-blue/30 border border-silver/10 rounded-xl p-6">
            <h2 className="text-white text-sm font-medium mb-2">📝 Generate B2B Blog Post</h2>
            <p className="text-xs text-silver/50 mb-4">800-1,500 word purchasing guide. Auto-publishes to /blog.</p>
            <div className="space-y-3">
              <input value={blogKeyword} onChange={(e) => { setBlogKeyword(e.target.value); setBlogSlug(slugify(e.target.value)); }}
                placeholder="e.g. how to choose a wine cooler supplier" className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white" />
              <input value={blogSlug} onChange={(e) => setBlogSlug(e.target.value)}
                className="w-full bg-deep-dark border border-silver/10 rounded px-3 py-2 text-sm text-white font-mono" />
              <Button onClick={generateBlog} disabled={blogGenerating}>{blogGenerating ? "⏳..." : "📝 Generate Blog"}</Button>
              {blogResult && <div className={`p-4 border rounded-lg ${blogResult.error ? "bg-red-400/10 border-red-400/20" : "bg-forest/10 border-forest/20"}`}>
                {blogResult.error ? <p className="text-red-400 text-xs">❌ {blogResult.error}</p> : (
                  <><p className="text-forest text-xs">✅ {blogResult.article?.wordCount} words</p>
                  <a href={blogResult.article?.url} target="_blank" className="text-xs text-forest underline mt-1 block">View on site →</a></>
                )}
              </div>}
            </div>
          </div>
        )}

        {/* === GSC ANALYTICS === */}
        {tab === "gsc" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-white text-sm font-medium">📈 Google Search Console</h2>
                <p className="text-xs text-silver/50 mt-1">Keyword performance and SEO opportunities for xmoso.com</p>
              </div>
              <div className="flex items-center gap-3">
                <select value={gscDays} onChange={(e) => setGscDays(parseInt(e.target.value))}
                  className="bg-deep-dark border border-silver/10 rounded px-3 py-2 text-xs text-white">
                  <option value="7">7 days</option><option value="28">28 days</option><option value="90">90 days</option>
                </select>
                <Button size="sm" onClick={loadGsc} disabled={gscLoading}>{gscLoading ? "Loading..." : "Refresh"}</Button>
                <a href="/api/seo/gsc/auth" target="_blank" className="text-xs text-forest hover:text-white underline">Re-connect GSC</a>
              </div>
            </div>

            {gscError && (
              <div className="bg-red-400/10 border border-red-400/20 rounded-xl p-6 mb-6">
                <p className="text-red-400 text-xs mb-2">⚠️ {gscError}</p>
                {gscError.includes("No refresh token") && (
                  <a href="/api/seo/gsc/auth" target="_blank"
                    className="inline-block px-6 py-3 bg-forest/80 text-white rounded-lg text-sm hover:bg-forest transition-colors">
                    🔗 Connect Google Search Console
                  </a>
                )}
              </div>
            )}

            {gscData && !gscError && (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    { label: "Total Impressions", value: gscData.totalImpressions?.toLocaleString() || "0", color: "text-ice" },
                    { label: "Total Clicks", value: gscData.totalClicks?.toLocaleString() || "0", color: "text-forest" },
                    { label: "Period", value: `${gscData.period?.days || 28}d`, color: "text-silver" },
                  ].map((c, i) => (
                    <div key={i} className="bg-deep-blue/20 border border-silver/10 rounded-xl p-5 text-center">
                      <p className={`text-2xl font-light ${c.color}`}>{c.value}</p>
                      <p className="text-xs text-silver/50 mt-1">{c.label}</p>
                    </div>
                  ))}
                </div>

                {/* Opportunities */}
                {gscData.opportunities?.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-white text-sm font-medium mb-3">🎯 Ranking Opportunities (page 2-3, high impressions)</h3>
                    <div className="space-y-2">
                      {gscData.opportunities.map((o: any, i: number) => (
                        <div key={i} className="bg-deep-blue/20 border border-forest/20 rounded-xl p-4 flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm truncate">{o.query}</p>
                            <p className="text-xs text-silver/50 mt-0.5">{o.impressions} impressions · position {o.position}</p>
                          </div>
                          <span className="text-xs text-forest shrink-0 ml-4">→ +{Math.round((o.clicks || 0) * (10 / o.position))} potential clicks</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top queries */}
                <div className="mb-8">
                  <h3 className="text-white text-sm font-medium mb-3">🔍 Top Queries</h3>
                  <div className="overflow-x-auto border border-silver/10 rounded-xl">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-deep-blue/40">
                          <th className="px-4 py-3 text-left text-xs text-silver/50 font-medium uppercase">Query</th>
                          <th className="px-4 py-3 text-right text-xs text-silver/50 font-medium uppercase">Impressions</th>
                          <th className="px-4 py-3 text-right text-xs text-silver/50 font-medium uppercase">Clicks</th>
                          <th className="px-4 py-3 text-right text-xs text-silver/50 font-medium uppercase">CTR</th>
                          <th className="px-4 py-3 text-right text-xs text-silver/50 font-medium uppercase">Position</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gscData.queries?.map((q: any, i: number) => (
                          <tr key={i} className={`border-t border-silver/5 ${q.position < 8 ? "bg-forest/5" : q.position < 20 ? "bg-amber/5" : ""}`}>
                            <td className="px-4 py-3 text-white text-xs max-w-[250px] truncate">{q.query}</td>
                            <td className="px-4 py-3 text-right text-silver/70">{q.impressions}</td>
                            <td className="px-4 py-3 text-right text-silver/70">{q.clicks}</td>
                            <td className="px-4 py-3 text-right text-silver/70">{(q.ctr * 100).toFixed(1)}%</td>
                            <td className="px-4 py-3 text-right font-medium" style={{ color: q.position <= 10 ? "#009f4b" : q.position <= 20 ? "#E8A838" : "#CC6666" }}>
                              {q.position}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top pages */}
                <div>
                  <h3 className="text-white text-sm font-medium mb-3">📄 Top Pages</h3>
                  <div className="space-y-2">
                    {gscData.topPages?.map((p: any, i: number) => (
                      <div key={i} className="bg-deep-blue/20 border border-silver/10 rounded-xl p-4">
                        <p className="text-white text-xs font-mono truncate">{p.page}</p>
                        <p className="text-xs text-silver/50 mt-1">{p.impressions} impressions · {p.clicks} clicks</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {!gscData && !gscError && !gscLoading && (
              <div className="text-center py-16">
                <p className="text-silver/40 text-sm mb-4">Click Refresh to load Google Search Console data.</p>
                <Button onClick={loadGsc}>📊 Load Analytics</Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
