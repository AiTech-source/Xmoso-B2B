/**
 * AI SEO Content Generator — Core Engine
 *
 * RAG pipeline: keyword → DeepSeek embedding → Supabase vector search → DeepSeek generation → persist
 * Uses DeepSeek API (deepseek-chat for generation, deepseek-embedding for embeddings)
 */
import { createClient } from "@supabase/supabase-js";

// ── Types ──

export interface ArticleInput {
  keyword: string;
  slug: string;
}

export interface GeneratedArticle {
  slug: string;
  title: string;
  meta_description: string;
  content_markdown: string;
  keyword: string;
  status: "published";
}

// ── Config ──

const DEEPSEEK_BASE = "https://api.deepseek.com/v1";
const DEEPSEEK_MODEL = "deepseek-chat";
const DEEPSEEK_EMBEDDING = "deepseek-embedding";
const EMBEDDING_DIM = 1536; // Schema dimension for pgvector

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY || process.env.Deepseek_B2B_SEO;
  if (!key) throw new Error("Missing DeepSeek API key — set GEMINI_API_KEY or Deepseek_B2B_SEO");
  return key;
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key);
}

// ── DeepSeek API helpers ──

async function deepseekPost(path: string, body: Record<string, unknown>) {
  const apiKey = getApiKey();
  const resp = await fetch(`${DEEPSEEK_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(`DeepSeek API error (${resp.status}): ${data?.error?.message || JSON.stringify(data).slice(0, 200)}`);
  }
  return data;
}

// ── Embedding ──

async function embed(text: string): Promise<number[]> {
  try {
    const data = await deepseekPost("/embeddings", {
      model: DEEPSEEK_EMBEDDING,
      input: text,
    });
    const values: number[] = data?.data?.[0]?.embedding || [];
    if (values.length === 0) throw new Error("Empty embedding returned");

    // Pad or truncate to 1536 for schema
    if (values.length >= EMBEDDING_DIM) return values.slice(0, EMBEDDING_DIM);
    return [...values, ...new Array(EMBEDDING_DIM - values.length).fill(0)];
  } catch (e) {
    console.warn("[embed] DeepSeek embedding failed:", (e as Error).message);
    return new Array(EMBEDDING_DIM).fill(0);
  }
}

// ── RAG: vector search ──

interface KnowledgeChunk {
  id: string;
  category: string;
  title: string;
  content: string;
  similarity: number;
}

async function retrieveRelevantKnowledge(query: string): Promise<KnowledgeChunk[]> {
  const supabase = getSupabase();
  const queryEmbedding = await embed(query);

  const { data, error } = await supabase.rpc("match_technical_knowledge", {
    query_embedding: queryEmbedding,
    match_threshold: 0.3,
    match_count: 3,
  });

  if (error) {
    console.warn("RAG vector search failed:", error.message);
    return [];
  }
  return (data as KnowledgeChunk[]) || [];
}

// ── Prompt ──

function buildSystemPrompt(context: KnowledgeChunk[]): string {
  const contextBlock = context.length > 0
    ? context.map((c, i) =>
        `[Technical Reference ${i + 1}] ${c.title}\nCategory: ${c.category}\nContent: ${c.content}`
      ).join("\n\n")
    : "(No specific technical knowledge retrieved. Base analysis on general engineering principles.)";

  return `You are a Senior R&D Engineer specializing in thermodynamics, heat transfer, and refrigeration engineering. You work for a premium wine cooler / commercial refrigeration manufacturer.

## Writing Style
- Write in authoritative engineering language. Use passive voice where appropriate.
- **NEVER use** marketing jargon: "industry-leading", "revolutionary", "cutting-edge", "unprecedented", "game-changing", "state-of-the-art", "best-in-class".
- Support every claim with specific engineering parameters, physical quantities, or industry standard references.
- Write in fluent technical English suitable for B2B procurement engineers and industry experts.

## Technical Context
Integrate the following enterprise technical knowledge as factual engineering evidence:

${contextBlock}

## Output Format
First line must be exactly: ---
Then YAML frontmatter with title and meta_description:
title: The Engineering Article Title
meta_description: A 150-160 character SEO description summarizing the article.

Then --- on its own line.
Then the article body in Markdown.`;
}

function buildUserPrompt(keyword: string): string {
  return `Write a 1500-2500 word technical engineering analysis article on: "${keyword}"

Required structure:
1. **Introduction** — Engineering significance of this topic in commercial refrigeration
2. **Engineering Principles** — Relevant thermodynamics, heat transfer, fluid mechanics
3. **Technical Implementation** — Practical application in product design, referencing provided knowledge
4. **Performance Metrics** — Typical parameters and test data (based on industry standards like EN 60335-2-24, ISO 23953, ASHRAE)
5. **Conclusion** — Engineering outlook and future directions

Requirements:
- Minimum 3 specific engineering parameters or physical quantities per section
- All technical claims must reference provided knowledge or established engineering standards
- Total: 1500-2500 words`;
}

// ── Parse AI Response ──

function parseArticleResponse(text: string, keyword: string, slug: string): GeneratedArticle {
  const fmMatch = text.match(/^---\n([\s\S]*?)\n---\n?/);
  let title = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  let metaDescription = `Technical analysis of ${keyword} in commercial refrigeration engineering.`;

  if (fmMatch) {
    const fm = fmMatch[1];
    const titleMatch = fm.match(/title:\s*(.+)/);
    const metaMatch = fm.match(/meta_description:\s*(.+)/);
    if (titleMatch) title = titleMatch[1].trim();
    if (metaMatch) metaDescription = metaMatch[1].trim().slice(0, 160);
  }

  const content = fmMatch ? text.slice(fmMatch[0].length).trim() : text.trim();
  return { slug, title, meta_description: metaDescription, content_markdown: content, keyword, status: "published" };
}

// ── Main Pipeline ──

export async function generateArticleFlow(keyword: string, slug: string): Promise<GeneratedArticle> {
  console.log(`[Pipeline] Starting: keyword="${keyword}" slug="${slug}"`);

  // 1. RAG
  console.log("[Pipeline] Retrieving knowledge…");
  const context = await retrieveRelevantKnowledge(keyword);
  console.log(`[Pipeline] Retrieved ${context.length} chunks`);

  // 2. Build prompts
  const systemPrompt = buildSystemPrompt(context);
  const userPrompt = buildUserPrompt(keyword);

  // 3. Generate with DeepSeek
  console.log("[Pipeline] Calling DeepSeek…");
  const data = await deepseekPost("/chat/completions", {
    model: DEEPSEEK_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.4,
    max_tokens: 8192,
    top_p: 0.9,
  });

  const text = data?.choices?.[0]?.message?.content || "";
  if (!text || text.length < 300) {
    throw new Error(`Generated content too short (${text?.length || 0} chars)`);
  }
  console.log(`[Pipeline] DeepSeek → ${text.length} chars`);

  // 4. Parse
  const article = parseArticleResponse(text, keyword, slug);
  console.log(`[Pipeline] Generated: "${article.title}"`);
  return article;
}

// ── Persist ──

export async function persistArticle(article: GeneratedArticle, options: { allowUpdate?: boolean } = {}): Promise<string> {
  const supabase = getSupabase();

  const payload = { ...article, updated_at: new Date().toISOString() };
  const query = options.allowUpdate
    ? supabase.from("seo_articles").upsert(payload, { onConflict: "slug" }).select("id").single()
    : supabase.from("seo_articles").insert(payload).select("id").single();

  const { data, error } = await query;
  if (error) throw new Error(`Failed to persist: ${error.message}`);
  console.log(`[Pipeline] Persisted: /insights/${article.slug}`);
  return data.id;
}
