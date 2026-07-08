import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { createServerStaticClient } from "@/lib/supabase/server-static";
import { generateLocaleParams } from "@/lib/static-params";
import type { Metadata } from "next";

export const revalidate = 86400;
export const generateStaticParams = generateLocaleParams;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Engineering Insights — Xmoso",
    description: "Technical deep-dives into wine cooler engineering, thermodynamics, and precision cooling technology.",
    alternates: { canonical: locale === "en" ? "/insights" : `/${locale}/insights` },
  };
}

export default async function InsightsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supa = await createServerStaticClient();

  const { data: articles } = supa ? await supa
    .from("seo_articles")
    .select("slug, title, meta_description, keyword, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false }) : { data: null };

  const prefix = locale === "en" ? "" : `/${locale}`;

  return (
    <>
      <Header />
      <main style={{ paddingTop: "64px", minHeight: "80vh" }}>
        <Breadcrumbs items={[{ label: "Engineering Insights" }]} />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h1 className="text-3xl font-light tracking-wider text-white mb-2">
            Engineering Insights
          </h1>
          <p className="text-sm text-silver/50 mb-12 max-w-xl">
            Technical deep-dives into wine cooler engineering, thermodynamics, and precision cooling technology — written from an engineer&apos;s perspective.
          </p>

          {!articles?.length && (
            <div className="text-center py-20">
              <p className="text-silver/40 text-sm">No articles published yet. Check back soon.</p>
            </div>
          )}

          <div className="space-y-6">
            {articles?.map((a: any) => (
              <Link key={a.slug} href={`${prefix}/insights/${a.slug}`}
                className="block bg-deep-blue/20 border border-silver/10 rounded-xl p-6 hover:border-forest/30 transition-all group">
                <h2 className="text-lg text-white font-light tracking-wide group-hover:text-forest transition-colors">
                  {a.title}
                </h2>
                <p className="text-sm text-silver/50 mt-2 leading-relaxed line-clamp-2">
                  {a.meta_description}
                </p>
                <div className="flex items-center gap-3 mt-3 text-xs text-silver/40">
                  <span>{a.keyword}</span>
                  <span>·</span>
                  <span>{new Date(a.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
