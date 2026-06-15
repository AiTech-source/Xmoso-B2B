import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale") || "en";
  const slug = searchParams.get("slug");

  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ posts: [] });

  if (slug) {
    const { data } = await supabase
      .from("blog_posts").select("*")
      .eq("locale", locale).eq("slug", slug).single();
    return Response.json({ post: data || null });
  }

  const includeUnpublished = searchParams.get("all") === "true";
  let query = supabase.from("blog_posts").select("*").eq("locale", locale);
  if (!includeUnpublished) query = query.eq("published", true);
  const { data } = await query.order("created_at", { ascending: false });

  return Response.json({ posts: data || [] });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { title, slug, excerpt, content, author, cover_image, locale, published } = body;
  if (!title || !slug) return Response.json({ error: "Title and slug required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "No client" }, { status: 500 });

  const { data, error } = await supabase.from("blog_posts").insert({
    title, slug: slug.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    excerpt: excerpt || "", content: content || { blocks: [] },
    author: author || "", cover_image: cover_image || "",
    locale: locale || "en", published: published || false,
  }).select().single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { id, title, slug, excerpt, content, author, cover_image, locale, published } = body;
  if (!id) return Response.json({ error: "ID required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "No client" }, { status: 500 });

  const updates: any = { updated_at: new Date().toISOString() };
  if (title !== undefined) updates.title = title;
  if (slug !== undefined) updates.slug = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  if (excerpt !== undefined) updates.excerpt = excerpt;
  if (content !== undefined) updates.content = content;
  if (author !== undefined) updates.author = author;
  if (cover_image !== undefined) updates.cover_image = cover_image;
  if (locale !== undefined) updates.locale = locale;
  if (published !== undefined) updates.published = published;

  const { error } = await supabase.from("blog_posts").update(updates).eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return Response.json({ error: "ID required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "No client" }, { status: 500 });

  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
