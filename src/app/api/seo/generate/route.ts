/**
 * POST /api/seo/generate
 *
 * Admin API — triggers AI SEO article generation.
 * Requires x-api-key header matching ADMIN_API_KEY env var.
 *
 * Body: { keyword: string, slug: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { generateArticleFlow, persistArticle } from "@/lib/seo/generate";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  buildUniqueSlug,
  claimNextBacklogItem,
  markBacklogError,
  markBacklogPublished,
  type SeoKeywordBacklogRow,
} from "@/lib/seo/keyword-backlog";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

export async function POST(req: NextRequest) {
  // Simple auth check
  const apiKey = req.headers.get("x-api-key");
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  let { keyword, slug } = body;
  const locale = body.locale || "en";
  const fromBacklog = body.fromBacklog === true || body.fromBacklog === "true";
  const allowUpdate = body.allowUpdate === true || body.allowUpdate === "true";
  let backlogItem: SeoKeywordBacklogRow | null = null;

  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  if (fromBacklog) {
    try {
      backlogItem = await claimNextBacklogItem(supabase, { contentType: "insight", locale });
      if (!backlogItem) return NextResponse.json({ message: "No new insight keyword in backlog", skipped: true });
      keyword = backlogItem.keyword || "";
      slug = backlogItem.slug || keyword;
    } catch (err: unknown) {
      return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
    }
  }

  if (!keyword || !slug) {
    return NextResponse.json(
      { error: "Missing required fields: keyword, slug" },
      { status: 400 },
    );
  }

  const { data: slugRows } = await supabase.from("seo_articles").select("slug");
  const existingSlugs = new Set<string>(((slugRows || []) as { slug: string }[]).map((row) => row.slug));
  slug = fromBacklog
    ? buildUniqueSlug(slug, existingSlugs)
    : String(slug).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  if (existingSlugs.has(slug) && !allowUpdate) {
    return NextResponse.json(
      { error: "slug already exists; pass allowUpdate=true to overwrite intentionally", slug },
      { status: 409 },
    );
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return NextResponse.json(
      { error: "Slug must be lowercase alphanumeric with hyphens only" },
      { status: 400 },
    );
  }

  try {
    const article = await generateArticleFlow(keyword, slug);
    const articleId = await persistArticle(article, { allowUpdate });

    await markBacklogPublished(supabase, backlogItem?.id, {
      tableName: "seo_articles",
      recordId: articleId,
      path: `/insights/${article.slug}`,
      slug: article.slug,
    });

    return NextResponse.json({
      success: true,
      article: {
        slug: article.slug,
        title: article.title,
        url: `/insights/${article.slug}`,
      },
    });
  } catch (err: unknown) {
    console.error("[API] Generation failed:", err);
    await markBacklogError(supabase, backlogItem?.id, errorMessage(err));
    return NextResponse.json(
      { error: errorMessage(err) || "Generation failed" },
      { status: 500 },
    );
  }
}
