import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ogImageUrl, getOgSettings } from "@/lib/seo/og";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const ogSet = await getOgSettings(undefined as any);
  const title = locale === "zh" ? "新闻" : "Blog";
  return { title, alternates: { canonical: locale === "en" ? "/blog" : `/${locale}/blog` } };
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createServerSupabaseClient();
  let posts: any[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("blog_posts").select("*")
      .eq("locale", locale).eq("published", true)
      .order("sort_order", { ascending: true }).order("created_at", { ascending: false });
    posts = data || [];
  }

  const t = (en: string, zh: string) => locale === "zh" ? zh : en;

  return (
    <>
      <Header />
      <main style={{ paddingTop: "64px" }} className="min-h-screen">
        <Breadcrumbs items={[{ label: t("Blog", "新闻") }]} />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-3xl md:text-4xl font-light tracking-wider text-white mb-8">
            {t("Blog", "新闻")}
          </h1>

          {posts.length === 0 && (
            <p className="text-silver/40 text-sm text-center py-20">
              {t("No posts yet. Check back soon.", "暂无内容，敬请期待。")}
            </p>
          )}

          <div className="space-y-8">
            {posts.map((post) => (
              <article key={post.id} className="bg-deep-blue/20 border border-silver/10 rounded-xl overflow-hidden hover:border-forest/30 transition-colors group">
                <Link href={`/${locale}/blog/${post.slug}`} className="block md:flex">
                  {post.cover_image && (
                    <div className="md:w-72 shrink-0 bg-[#f5f0e8] overflow-hidden">
                      <img src={post.cover_image} loading="lazy" alt={post.title} className="w-full h-48 md:h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    </div>
                  )}
                  <div className="p-6 flex flex-col justify-center">
                    <p className="text-xs text-silver/40 mb-2">{(post.created_at || "").slice(0, 10)}</p>
                    <h2 className="text-xl text-white font-light tracking-wide mb-2 group-hover:text-forest transition-colors">{post.title}</h2>
                    {post.excerpt && <p className="text-sm text-silver/60 leading-relaxed">{post.excerpt}</p>}
                    {post.author && <p className="text-xs text-silver/40 mt-3">By {post.author}</p>}
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
