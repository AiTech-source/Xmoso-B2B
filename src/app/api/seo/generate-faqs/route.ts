/**
 * POST /api/seo/generate-faqs
 * AI-generates FAQ entries for a product type/category and writes to product_faqs table
 *
 * Body: { product_type: string, locale?: "en"|"zh", count?: number }
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const API_KEY = process.env.GEMINI_API_KEY || process.env.Deepseek_B2B_SEO;

const SYSTEM_PROMPT = `You are an ecommerce content specialist for a wine cooler manufacturer.
Generate clear, accurate B2B FAQ items. Each answer must be factual and reference real engineering parameters.

Output ONLY valid JSON array — no markdown, no code fences:
[
  {
    "question": "What is the minimum order quantity?",
    "answer": "MOQ is 50-100 units per model..."
  }
]`;

async function callDeepSeek(prompt: string): Promise<string> {
  const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 2048,
    }),
  });
  const data = await resp.json();
  return data?.choices?.[0]?.message?.content || "";
}

function parseFaqs(text: string): { question: string; answer: string }[] {
  // Strip code fences if present
  let clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  try {
    const parsed = JSON.parse(clean);
    if (Array.isArray(parsed)) return parsed.slice(0, 8);
    return [];
  } catch {
    // Try to extract JSON array via regex
    const match = clean.match(/\[[\s\S]*\]/);
    if (match) {
      try { return JSON.parse(match[0]).slice(0, 8); } catch { return []; }
    }
    return [];
  }
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { product_type, locale = "en", count = 6 } = await req.json();
  if (!product_type) return NextResponse.json({ error: "product_type required" }, { status: 400 });

  const lang = locale === "zh" ? "Chinese" : "English";

  const prompt = `Generate ${count} B2B FAQ items in ${lang} for product category: "${product_type}".
Cover these topics: MOQ, certifications, lead time, customization options, shipping, warranty, and payment terms.
Each answer should be 1-3 sentences with specific details.`;

  try {
    const raw = await callDeepSeek(prompt);
    const faqs = parseFaqs(raw);

    if (faqs.length === 0) {
      return NextResponse.json({ error: "Failed to parse AI output", raw }, { status: 500 });
    }

    // Insert into product_faqs table
    const supabase = await createServerSupabaseClient();
    if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

    const inserted: any[] = [];
    for (let i = 0; i < faqs.length; i++) {
      const { data, error } = await supabase.from("product_faqs").insert({
        product_type,
        locale,
        question: faqs[i].question,
        answer: faqs[i].answer,
        sort_order: i + 1,
      }).select().single();
      if (error) console.warn("Insert error:", error.message);
      else inserted.push(data);
    }

    return NextResponse.json({ success: true, count: inserted.length, product_type, locale });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
