/**
 * AI SEO Content Pipeline — CLI Entry Point
 *
 * Usage:
 *   npx tsx scripts/generate-seo-pipeline.ts --keyword "wine cooler compressor efficiency" --slug "compressor-efficiency-analysis"
 *
 * Environment variables required:
 *   GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { generateArticleFlow, persistArticle } from "../src/lib/seo/generate";

async function main() {
  const args = process.argv.slice(2);
  const keywordIdx = args.indexOf("--keyword");
  const slugIdx = args.indexOf("--slug");

  const keyword = keywordIdx !== -1 ? args[keywordIdx + 1] : "";
  const slug = slugIdx !== -1 ? args[slugIdx + 1] : "";

  if (!keyword || !slug) {
    console.error("Usage: npx tsx scripts/generate-seo-pipeline.ts --keyword <keyword> --slug <slug>");
    process.exit(1);
  }

  console.log(`\n🚀 AI SEO Pipeline Start`);
  console.log(`   Keyword: "${keyword}"`);
  console.log(`   Slug:    "${slug}"\n`);

  try {
    const article = await generateArticleFlow(keyword, slug);
    await persistArticle(article);

    console.log(`\n✅ Article generated and published!`);
    console.log(`   Title: ${article.title}`);
    console.log(`   URL:   /insights/${article.slug}\n`);
  } catch (err: any) {
    console.error(`\n❌ Pipeline failed: ${err.message}\n`);
    process.exit(1);
  }
}

main();
