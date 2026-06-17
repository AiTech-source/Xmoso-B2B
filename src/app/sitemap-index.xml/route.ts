import sitemap from "../sitemap";

export async function GET() {
  const entries = await sitemap();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.map((entry: any) => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${new Date(entry.lastModified || new Date()).toISOString().split("T")[0]}</lastmod>
    <changefreq>${entry.changeFrequency || "monthly"}</changefreq>
    <priority>${entry.priority || 0.5}</priority>
    ${(entry.images || []).map((img: string) => `    <image:image><image:loc>${img}</image:loc></image:image>`).join("\n")}
  </url>`).join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, must-revalidate",
    },
  });
}
