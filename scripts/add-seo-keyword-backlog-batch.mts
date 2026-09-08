import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { slugifyKeyword, type SeoKeywordBacklogRow } from "../src/lib/seo/keyword-backlog";

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

const candidates: Array<Omit<SeoKeywordBacklogRow, "status" | "locale" | "slug"> & { locale?: string; slug?: string }> = [
  { keyword: "built in wine cooler ventilation clearance cabinet design guide", content_type: "blog", source: "installation", intent: "buyer_checklist", priority: 94, notes: "Cabinet clearance and front ventilation guidance." },
  { keyword: "dual zone wine cooler for red and white wine temperature planning", content_type: "blog", source: "product_feature", intent: "user_pain", priority: 92, notes: "Buyer-facing guide for independent dual-zone use." },
  { keyword: "wine cooler glass door condensation causes and prevention", content_type: "blog", source: "user_pain", intent: "troubleshooting", priority: 90, notes: "Condensation, humidity, door glass, gasket and installation conditions." },
  { keyword: "wine cooler compressor noise rating dba buyer guide", content_type: "blog", source: "user_pain", intent: "buyer_checklist", priority: 88, notes: "Explain dB(A), compressor cycling, airflow and cabinet resonance." },
  { keyword: "under counter wine cooler dimensions for kitchen cabinet makers", content_type: "blog", source: "b2b_procurement", intent: "installation", priority: 86, notes: "Cabinet maker focused dimensional planning." },
  { keyword: "wine cooler energy label ERP class explained for EU importers", content_type: "blog", source: "regulatory", intent: "b2b_procurement", priority: 84, notes: "EU importer guide around ERP class and labeling." },
  { keyword: "ODM wine cooler customization checklist for appliance brands", content_type: "blog", source: "b2b_procurement", intent: "buyer_checklist", priority: 82, notes: "Brand buyer checklist for ODM projects." },
  { keyword: "commercial bar refrigeration wine cabinet sourcing checklist", content_type: "blog", source: "b2b_procurement", intent: "buyer_checklist", priority: 80, notes: "Bar refrigeration sourcing angle." },
  { keyword: "wine cooler shelf design for burgundy bordeaux and champagne bottles", content_type: "blog", source: "product_feature", intent: "user_pain", priority: 78, notes: "Bottle fit and shelf geometry." },
  { keyword: "built in wine cooler door reversible hinge planning guide", content_type: "blog", source: "installation", intent: "buyer_checklist", priority: 76, notes: "Door swing, reversible hinge and kitchen layout." },
  { keyword: "front ventilation airflow path pressure drop in built in wine coolers", content_type: "insight", source: "engineering", intent: "engineering_analysis", priority: 94, notes: "Engineering analysis of airflow path and pressure drop." },
  { keyword: "dual zone wine cooler evaporator sensor control architecture", content_type: "insight", source: "engineering", intent: "engineering_analysis", priority: 92, notes: "Sensors, evaporator placement and independent zone control." },
  { keyword: "low e glass thermal radiation reduction for wine cooler doors", content_type: "insight", source: "engineering", intent: "engineering_analysis", priority: 90, notes: "Radiative heat transfer and Low-E surface orientation." },
  { keyword: "variable speed compressor duty cycle analysis for quiet wine storage", content_type: "insight", source: "engineering", intent: "engineering_analysis", priority: 88, notes: "Duty cycle, acoustic comfort and temperature stability." },
  { keyword: "wine cooler cabinet heat rejection calculation for built in installation", content_type: "insight", source: "engineering", intent: "engineering_analysis", priority: 86, notes: "Heat rejection and cabinet thermal balance." },
  { keyword: "triple pane glass door dew point analysis for wine coolers", content_type: "insight", source: "engineering", intent: "engineering_analysis", priority: 84, notes: "Condensation and dew point engineering explanation." },
];

const supabase = createClient(supabaseUrl, serviceRoleKey);
const rows = candidates.map((item) => ({
  keyword: item.keyword,
  slug: item.slug || slugifyKeyword(item.keyword || ""),
  locale: item.locale || "en",
  content_type: item.content_type,
  source: item.source || "manual",
  intent: item.intent || "b2b_procurement",
  priority: item.priority,
  status: "new",
  notes: item.notes || "",
}));

const { data, error } = await supabase
  .from("seo_keyword_backlog")
  .upsert(rows, { onConflict: "locale,content_type,keyword", ignoreDuplicates: true })
  .select("id,status,content_type");

if (error) throw new Error(error.message);

console.log(JSON.stringify({
  attempted: rows.length,
  insertedOrExisting: data?.length || 0,
  newBlog: rows.filter((row) => row.content_type === "blog").length,
  newInsight: rows.filter((row) => row.content_type === "insight").length,
}));
