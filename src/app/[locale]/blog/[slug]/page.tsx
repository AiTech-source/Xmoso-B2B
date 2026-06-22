import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import PageContentRenderer from "@/components/layout/PageContentRenderer";
import ShareButton from "@/components/social/ShareButton";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ogImageUrl } from "@/lib/seo/og";
import { renderJsonLd } from "@/lib/seo/json-ld";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { title: "Blog" };
  const { data: post } = await supabase.from("blog_posts").select("*").eq("locale", locale).eq("slug", slug).single();
  if (!post) return { title: "Not Found" };
  return {
    title: post.title,
    description: post.excerpt || undefined,
    alternates: { canonical: locale === "en" ? `/blog/${slug}` : `/${locale}/blog/${slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt || undefined,
      images: post.cover_image ? [{ url: post.cover_image }] : [{ url: ogImageUrl({ title: post.title, type: "page", brand: "Xmoso" }), width: 1200, height: 630 }],
    },
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const supabase = await createServerSupabaseClient();
  if (!supabase) notFound();

  const { data: post } = await supabase
    .from("blog_posts").select("*")
    .eq("locale", locale).eq("slug", slug).single();

  if (!post) notFound();

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || undefined,
    author: post.author ? { "@type": "Person", name: post.author } : undefined,
    datePublished: post.created_at,
    dateModified: post.updated_at || post.created_at,
    image: post.cover_image || undefined,
  };

  const t = (en: string, zh: string) => locale === "zh" ? zh : en;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: renderJsonLd(schema) }} />
      <Header />
      <main style={{ paddingTop: "64px" }}>
        <Breadcrumbs items={[
          { label: t("Blog", "新闻"), href: `/${locale}/blog` },
          { label: post.title },
        ]} />

        <article className="max-w-3xl mx-auto px-4 py-8">
          {post.cover_image && (
            <div className="rounded-xl overflow-hidden mb-8 bg-[#f5f0e8]">
              <img src={post.cover_image} loading="lazy" alt={post.title} className="w-full max-h-96 object-cover" />
            </div>
          )}

          <h1 className="text-3xl md:text-4xl font-light tracking-wider text-white mb-4">{post.title}</h1>

          <div className="flex items-center gap-4 text-xs text-silver/50 mb-6">
            {post.author && <span>By {post.author}</span>}
            <span>{(post.created_at || "").slice(0, 10)}</span>
          </div>

          {post.excerpt && (
            <p className="text-silver/60 leading-relaxed mb-8 text-sm">{post.excerpt}</p>
          )}

          <div className="mb-6">
            <ShareButton url={`/${locale}/blog/${slug}`} title={post.title} />
          </div>

          <div className="border-t border-silver/10 pt-8">
            <PageContentRenderer content={post.content} />
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
