import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { MarkdownRenderer } from "@/components/seo/MarkdownRenderer";
import { createServerStaticClient } from "@/lib/supabase/server-static";
import type { Metadata } from "next";

export const revalidate = 86400;
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const supa = await createServerStaticClient();
  if (!supa) return { title: "Article" };

  const { data } = await supa
    .from("seo_articles")
    .select("title, meta_description")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!data) return { title: "Not Found" };

  const canonical = locale === "en" ? `/insights/${slug}` : `/${locale}/insights/${slug}`;
  return {
    title: `${data.title} — Xmoso Engineering Insights`,
    description: data.meta_description,
    alternates: { canonical },
    openGraph: { type: "article", title: data.title, description: data.meta_description },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const supa = await createServerStaticClient();
  if (!supa) notFound();

  const { data: article } = await supa
    .from("seo_articles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!article) notFound();

  const prefix = locale === "en" ? "" : `/${locale}`;

  return (
    <>
      <Header />
      <main style={{ paddingTop: "64px", minHeight: "80vh" }}>
        <Breadcrumbs
          items={[
            { label: "Engineering Insights", href: `${prefix}/insights` },
            { label: article.title },
          ]}
        />

        <article className="max-w-3xl mx-auto px-4 py-16">
          <h1 className="text-3xl md:text-4xl font-light tracking-wider text-white leading-tight mb-4">
            {article.title}
          </h1>

          <div className="flex items-center gap-3 text-xs text-silver/40 mb-10 pb-8 border-b border-silver/10">
            <span>{article.keyword}</span>
            <span>·</span>
            <span>{new Date(article.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
          </div>

          <div className="insights-content">
            <MarkdownRenderer content={article.content_markdown} />
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
