/**
 * POST /api/seo/generate-blog
 * Generates a short B2B blog post (800-1500 words) from a keyword
 * No RAG required — directly targets purchasing-intent search queries
 *
 * Body: { keyword: string, slug: string, locale?: "en"|"zh" }
 * Inserts directly into blog_posts table
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const API_KEY = process.env.GEMINI_API_KEY || process.env.Deepseek_B2B_SEO;

async function callDeepSeek(messages: any[]) {
  const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      temperature: 0.5,
      max_tokens: 4096,
    }),
  });
  const data = await resp.json();
  return data?.choices?.[0]?.message?.content || "";
}

function parseHtmlTitle(body: string): { title: string; content: string } {
  const titleMatch = body.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const title = titleMatch ? titleMatch[1].trim() : body.split("\n")[0].replace(/^#\s*/, "").trim();
  const content = body.replace(/<h1[^>]*>([^<]+)<\/h1>/i, "").trim();
  return { title, content };
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { keyword, slug, locale = "en" } = await req.json();
  if (!keyword || !slug) return NextResponse.json({ error: "keyword and slug required" }, { status: 400 });

  const lang = locale === "zh" ? "Chinese" : "English";
  const isZh = locale === "zh";

  const systemPrompt = isZh
    ? `你是一位酒柜行业的 B2B 采购顾问。用中文撰写一篇 800-1200 字的行业资讯/采购指南。

语气：专业、可信、有数据支撑。目标读者是海外品牌商、进口商、经销商。
结构：无需 Markdown，直接输出 HTML（h2/p/ul/li）。
严禁营销套话。每段至少包含一个具体数据或参数。`
    : `You are a B2B purchasing advisor for the wine cooler industry.
Write a 800-1500 word blog post in English. Style: informative purchasing guide — not a sales pitch.

Tone: professional, data-backed, trustworthy. Target reader: overseas brand owners, importers, distributors.
Structure: output as HTML (h2/p/ul/li) — no markdown, no code fences.
Each paragraph must contain at least one specific number, parameter, or data point.
No marketing fluff. Focus on practical information that helps a buyer make a decision.

Wrap the title in <h1> tags at the top.`;

  const userPrompt = isZh
    ? `请围绕 "${keyword}" 撰写一篇采购指南。
内容要求：为什么这个主题对采购商重要、关键考虑因素、行业标准参考、采购建议。
800-1200 字，HTML 格式。`
    : `Write a B2B purchasing guide about: "${keyword}"
Cover: why this matters for buyers, key considerations, industry standards to reference, purchasing tips.
Use HTML format with <h2> sections and <p> paragraphs.
800-1500 words.`;

  try {
    const raw = await callDeepSeek([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    if (!raw || raw.length < 200) {
      return NextResponse.json({ error: "Generated content too short" }, { status: 500 });
    }

    const { title, content } = parseHtmlTitle(raw);
    const metaDesc = content.replace(/<[^>]+>/g, "").slice(0, 155).trim();

    // Generate a slug for blog_posts
    const blogSlug = slug || keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    // Insert into blog_posts
    const supabase = await createServerSupabaseClient();
    if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

    // Check if blog_posts has the columns we need
    const { data: existing } = await supabase.from("blog_posts").select("id").eq("slug", blogSlug).eq("locale", locale).maybeSingle();

    let blogId: string;
    const excerpt = content.replace(/<[^>]+>/g, "").slice(0, 155).trim();
    const body = {
      slug: blogSlug,
      title,
      excerpt,
      content: { blocks: [{ type: "raw-html", data: { html: content } }] },
      cover_image: "",
      locale,
      published: true,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      const { error } = await supabase.from("blog_posts").update({ ...body, updated_at: new Date().toISOString() }).eq("id", existing.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      blogId = existing.id;
    } else {
      const { data, error } = await supabase.from("blog_posts").insert(body).select("id").single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      blogId = data.id;
    }

    return NextResponse.json({
      success: true,
      article: {
        id: blogId,
        slug: blogSlug,
        title,
        url: `/${locale}/blog/${blogSlug}`,
        wordCount: content.replace(/<[^>]+>/g, "").split(/\s+/).length,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
