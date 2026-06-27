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
      {/* Light mode: convert blog inline colors to match site theme (black text, #009f4b green) */}
      <style>{`
        html[data-theme="light"] .blog-content-wrap p,
        html[data-theme="light"] .blog-content-wrap li,
        html[data-theme="light"] .blog-content-wrap div,
        html[data-theme="light"] .blog-content-wrap ul,
        html[data-theme="light"] .blog-content-wrap .rich-text-display,
        html[data-theme="light"] .blog-content-wrap td {
          color: #2A2A2A !important;
        }
        html[data-theme="light"] .blog-content-wrap h1,
        html[data-theme="light"] .blog-content-wrap h2,
        html[data-theme="light"] .blog-content-wrap h3 {
          color: #1A1A1A !important;
        }
        /* White/light-colored inline strong/span → dark in light mode */
        html[data-theme="light"] .blog-content-wrap [style*="color:#fff"],
        html[data-theme="light"] .blog-content-wrap [style*="color: #fff"],
        html[data-theme="light"] .blog-content-wrap [style*="color:#ffffff"],
        html[data-theme="light"] .blog-content-wrap [style*="color: #ffffff"],
        html[data-theme="light"] .blog-content-wrap [style*="color:rgba(255,255,255"],
        html[data-theme="light"] .blog-content-wrap [style*="color: rgba(255,255,255"] {
          color: #1A1A1A !important;
        }
        /* Green #8BC8A0 → #009f4b */
        html[data-theme="light"] .blog-content-wrap [style*="color:#8BC8A0"],
        html[data-theme="light"] .blog-content-wrap [style*="color: #8BC8A0"],
        html[data-theme="light"] .blog-content-wrap [style*="color:rgba(139,200,160"],
        html[data-theme="light"] .blog-content-wrap [style*="color: rgba(139,200,160"] {
          color: #009f4b !important;
        }
      `}</style>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: renderJsonLd(schema) }} />
      <Header />
      <main style={{ paddingTop: "64px" }}>
        <Breadcrumbs items={[
          { label: t("Blog", "新闻"), href: `/${locale}/blog` },
          { label: post.title },
        ]} />

        <article className="max-w-3xl mx-auto px-4 py-8 blog-content-wrap">
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
