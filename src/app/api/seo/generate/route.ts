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

export async function POST(req: NextRequest) {
  // Simple auth check
  const apiKey = req.headers.get("x-api-key");
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { keyword, slug } = await req.json();

  if (!keyword || !slug) {
    return NextResponse.json(
      { error: "Missing required fields: keyword, slug" },
      { status: 400 },
    );
  }

  // Validate slug format
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return NextResponse.json(
      { error: "Slug must be lowercase alphanumeric with hyphens only" },
      { status: 400 },
    );
  }

  try {
    const article = await generateArticleFlow(keyword, slug);
    await persistArticle(article);

    return NextResponse.json({
      success: true,
      article: {
        slug: article.slug,
        title: article.title,
        url: `/insights/${article.slug}`,
      },
    });
  } catch (err: any) {
    console.error("[API] Generation failed:", err);
    return NextResponse.json(
      { error: err.message || "Generation failed" },
      { status: 500 },
    );
  }
}
