import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { insertBacklogItem, listBacklogItems, slugifyKeyword } from "@/lib/seo/keyword-backlog";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

function authorized(req: NextRequest): boolean {
  return req.headers.get("x-api-key") === process.env.ADMIN_API_KEY;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const contentType = searchParams.get("content_type");
  const locale = searchParams.get("locale") || "en";

  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  try {
    const data = await listBacklogItems(supabase, { status, contentType, locale });
    return NextResponse.json({ keywords: data || [] });
  } catch (err: unknown) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const keyword = String(body.keyword || "").trim();
  const locale = body.locale || "en";
  const contentType = body.content_type || "blog";

  if (!keyword) return NextResponse.json({ error: "keyword required" }, { status: 400 });
  if (!["blog", "insight", "faq"].includes(contentType)) {
    return NextResponse.json({ error: "content_type must be blog, insight, or faq" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const payload = {
    keyword,
    slug: body.slug ? slugifyKeyword(String(body.slug)) : slugifyKeyword(keyword),
    locale,
    content_type: contentType,
    source: body.source || "manual",
    intent: body.intent || "b2b_procurement",
    priority: Number.isFinite(Number(body.priority)) ? Number(body.priority) : 50,
    status: body.status || "new",
    notes: body.notes || "",
  };

  try {
    const data = await insertBacklogItem(supabase, payload);
    return NextResponse.json({ keyword: data });
  } catch (err: unknown) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}
