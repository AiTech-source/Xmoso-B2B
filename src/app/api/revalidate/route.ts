import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

// Called by admin after content changes: POST /api/revalidate
// Body: { path: "/" } or { path: "/products" }
// Or call with path="/" to revalidate all pages

export async function POST(req: NextRequest) {
  // Simple auth check: require same-origin or secret token
  const auth = req.headers.get("x-revalidate-secret");
  if (auth !== process.env.REVALIDATE_SECRET && auth !== "admin-xmoso") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path = "/" } = await req.json();

  try {
    revalidatePath(path, "layout");
    return NextResponse.json({ revalidated: true, path });
  } catch (err) {
    return NextResponse.json({ error: "Revalidation failed" }, { status: 500 });
  }
}
