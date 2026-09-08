import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_BACKLOG_SEED } from "../src/lib/seo/keyword-backlog";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const match = line.match(/^\s*([^#=]+)=(.*)$/);
  if (!match) continue;
  const [, key, rawValue] = match;
  process.env[key.trim()] = rawValue.trim().replace(/^['"]|['"]$/g, "");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
const { count, error: countError } = await supabase
  .from("seo_keyword_backlog")
  .select("id", { count: "exact", head: true });

if (countError) throw new Error(countError.message);

if ((count || 0) > 0) {
  console.log(JSON.stringify({ countBefore: count, inserted: 0 }));
  process.exit(0);
}

const rows = DEFAULT_BACKLOG_SEED.map(({ keyword, slug, locale, content_type, source, intent, priority, notes }) => ({
  keyword,
  slug,
  locale,
  content_type,
  source,
  intent,
  priority,
  notes,
}));

const { error: insertError } = await supabase.from("seo_keyword_backlog").insert(rows);
if (insertError) throw new Error(insertError.message);

console.log(JSON.stringify({ countBefore: count || 0, inserted: rows.length }));
