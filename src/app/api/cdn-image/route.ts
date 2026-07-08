import { NextRequest, NextResponse } from "next/server";

function parseParams(urlString: string): { width: number; quality: number } {
  try {
    const u = new URL(urlString, "http://localhost");
    return {
      width: parseInt(u.searchParams.get("w") || "0") || 0,
      quality: parseInt(u.searchParams.get("q") || "0") || 0,
    };
  } catch {
    return { width: 0, quality: 0 };
  }
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  const decoded = decodeURIComponent(raw);
  if (!decoded.includes("supabase.co/storage/v1/object/public/")) {
    return NextResponse.json({ error: "Invalid source" }, { status: 403 });
  }

  const { width, quality } = parseParams(decoded);
  const cleanUrl = decoded.replace(/[?&]w=\d+/g, "").replace(/[?&]q=\d+/g, "");

  try {
    const resp = await fetch(cleanUrl, { headers: { Accept: "image/webp,image/avif,image/*,*/*" } });
    if (!resp.ok) return NextResponse.json({ error: "Upstream failed" }, { status: resp.status });

    const buffer = Buffer.from(await resp.arrayBuffer());
    const contentType = resp.headers.get("content-type") || "image/webp";

    // Resize + compress large images using sharp (pre-installed on Vercel)
    if (width > 0 && buffer.length > 20000) {
      try {
        const sharp = (await import("sharp")).default;
        const q = quality > 0 ? quality : 65;
        const resized = await sharp(buffer)
          .resize(width, undefined, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: q })
          .toBuffer();
        if (resized.length < buffer.length) {
          return new NextResponse(new Uint8Array(resized), {
            headers: {
              "Content-Type": "image/webp",
              "Cache-Control": "public, max-age=86400, s-maxage=31536000, immutable",
            },
          });
        }
      } catch { /* fall through to original */ }
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Proxy error" }, { status: 502 });
  }
}
