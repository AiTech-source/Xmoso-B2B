/* eslint-disable @typescript-eslint/no-explicit-any */
export type SeoContentType = "blog" | "insight" | "faq";
export type SeoBacklogStatus = "new" | "selected" | "published" | "drafted" | "rejected" | "error";

export interface SeoKeywordBacklogRow {
  id?: string;
  keyword?: string;
  slug?: string | null;
  locale: string;
  content_type: SeoContentType;
  source?: string;
  intent?: string;
  priority: number;
  status: SeoBacklogStatus;
  notes?: string | null;
  generated_table?: string;
  generated_id?: string;
  generated_path?: string;
  last_error?: string;
  picked_at?: string;
  generated_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CronRequest {
  path: string;
  body: Record<string, string>;
}

const SETTINGS_BACKLOG_KEY = "seo_keyword_backlog";

const DEFAULT_BACKLOG_SEED: SeoKeywordBacklogRow[] = [
  { keyword: "front bottom ventilation built in wine cooler installation", slug: "front-bottom-ventilation-built-in-wine-cooler-installation", locale: "en", content_type: "blog", source: "product_feature", intent: "installation", priority: 95, status: "new", notes: "XBI patented front-bottom self ventilation." },
  { keyword: "touch open wine cooler glass door compared with push latch", slug: "touch-open-wine-cooler-glass-door-vs-push-latch", locale: "en", content_type: "blog", source: "product_feature", intent: "user_pain", priority: 92, status: "new", notes: "Touch-open interaction compared with push latch gap drift." },
  { keyword: "true dual zone wine cooler 5 to 20 celsius both compartments", slug: "true-dual-zone-wine-cooler-5-20c-both-compartments", locale: "en", content_type: "blog", source: "product_feature", intent: "user_pain", priority: 90, status: "new", notes: "Both upper and lower zones support red or white wine storage." },
  { keyword: "wine cooler that fits champagne bottles up to 90mm diameter", slug: "wine-cooler-fits-90mm-champagne-bottles", locale: "en", content_type: "blog", source: "product_feature", intent: "user_pain", priority: 88, status: "new", notes: "Top shelf large champagne bottle fit." },
  { keyword: "triple pane dual low e glass wine cooler door benefits", slug: "triple-pane-dual-low-e-glass-wine-cooler-door-benefits", locale: "en", content_type: "blog", source: "product_feature", intent: "technical_explainer", priority: 86, status: "new", notes: "UV, insulation, damping, flavor and aroma protection." },
  { keyword: "Embraco inverter compressor wine cooler quiet energy saving", slug: "embraco-inverter-compressor-wine-cooler-quiet-energy-saving", locale: "en", content_type: "blog", source: "product_feature", intent: "technical_explainer", priority: 84, status: "new", notes: "International compressor brand, quiet running, compact size, energy savings." },
  { keyword: "built in wine cooler no top box compact cabinet integration", slug: "built-in-wine-cooler-no-top-box-cabinet-integration", locale: "en", content_type: "blog", source: "competitor_gap", intent: "installation", priority: 82, status: "new", notes: "Compare visible top-box clutter vs compact integration without naming competitors." },
  { keyword: "wine fridge too noisy causes and what buyers should check", slug: "wine-fridge-too-noisy-causes-buyer-checklist", locale: "en", content_type: "blog", source: "user_pain", intent: "user_pain", priority: 78, status: "new", notes: "Noise pain point: compressor, airflow, installation." },
  { keyword: "wine cooler not cooling evenly dual zone buyer checklist", slug: "wine-cooler-not-cooling-evenly-dual-zone-checklist", locale: "en", content_type: "blog", source: "user_pain", intent: "user_pain", priority: 76, status: "new", notes: "Cooling consistency and zone design." },
  { keyword: "custom wine cooler for cabinet makers ODM requirements", slug: "custom-wine-cooler-cabinet-makers-odm-requirements", locale: "en", content_type: "blog", source: "b2b_procurement", intent: "b2b_procurement", priority: 74, status: "new", notes: "Cabinet-maker buyer intent and integration details." },
  { keyword: "wine cooler MOQ certification lead time China supplier checklist", slug: "wine-cooler-moq-certification-lead-time-china-supplier-checklist", locale: "en", content_type: "blog", source: "b2b_procurement", intent: "b2b_procurement", priority: 72, status: "new", notes: "Procurement checklist for importers and distributors." },
  { keyword: "front bottom self ventilation airflow design for built in wine coolers", slug: "front-bottom-self-ventilation-airflow-design-built-in-wine-coolers", locale: "en", content_type: "insight", source: "product_feature", intent: "engineering_analysis", priority: 95, status: "new", notes: "Engineering article around patented airflow path and cabinet constraints." },
  { keyword: "thermal insulation analysis of triple pane dual low e wine cooler glass doors", slug: "thermal-insulation-analysis-triple-pane-dual-low-e-wine-cooler-glass", locale: "en", content_type: "insight", source: "product_feature", intent: "engineering_analysis", priority: 92, status: "new", notes: "Engineering article on heat transfer, UV and Low-E coating surfaces." },
  { keyword: "variable speed compressor control logic for quiet wine coolers", slug: "variable-speed-compressor-control-logic-quiet-wine-coolers", locale: "en", content_type: "insight", source: "product_feature", intent: "engineering_analysis", priority: 88, status: "new", notes: "Engineering article on inverter compressor cycling, noise and efficiency." },
  { keyword: "true dual zone temperature control architecture for wine coolers", slug: "true-dual-zone-temperature-control-architecture-wine-coolers", locale: "en", content_type: "insight", source: "product_feature", intent: "engineering_analysis", priority: 86, status: "new", notes: "Engineering article on independent zones and 5-20C flexibility." },
];

function nowIso(): string {
  return new Date().toISOString();
}

function tableMissing(error: { code?: string; message?: string } | null | undefined): boolean {
  const message = error?.message || "";
  return error?.code === "42P01" || message.includes("seo_keyword_backlog") || message.includes("Could not find the table");
}

function withDefaults(row: SeoKeywordBacklogRow): SeoKeywordBacklogRow {
  const stamp = nowIso();
  return {
    id: row.id || crypto.randomUUID(),
    keyword: row.keyword || "",
    slug: row.slug || slugifyKeyword(row.keyword || ""),
    locale: row.locale || "en",
    content_type: row.content_type || "blog",
    source: row.source || "manual",
    intent: row.intent || "b2b_procurement",
    priority: Number.isFinite(row.priority) ? row.priority : 50,
    status: row.status || "new",
    notes: row.notes || "",
    generated_table: row.generated_table || "",
    generated_id: row.generated_id || "",
    generated_path: row.generated_path || "",
    last_error: row.last_error || "",
    picked_at: row.picked_at || "",
    generated_at: row.generated_at || "",
    created_at: row.created_at || stamp,
    updated_at: row.updated_at || stamp,
  };
}

async function readSettingsBacklog(supabase: any): Promise<SeoKeywordBacklogRow[]> {
  const { data, error } = await supabase.from("site_settings").select("value").eq("key", SETTINGS_BACKLOG_KEY).maybeSingle();
  if (error) throw new Error(`Failed to read settings keyword backlog: ${error.message}`);
  if (!data?.value) {
    const seeded = DEFAULT_BACKLOG_SEED.map(withDefaults);
    await writeSettingsBacklog(supabase, seeded);
    return seeded;
  }
  try {
    const parsed = JSON.parse(data.value);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(withDefaults);
  } catch {
    return [];
  }
}

async function writeSettingsBacklog(supabase: any, rows: SeoKeywordBacklogRow[]): Promise<void> {
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key: SETTINGS_BACKLOG_KEY, value: JSON.stringify(rows.map(withDefaults)) }, { onConflict: "key" });
  if (error) throw new Error(`Failed to write settings keyword backlog: ${error.message}`);
}

function filterBacklogRows(
  rows: SeoKeywordBacklogRow[],
  filters: { contentType?: string | null; locale?: string; status?: string | null },
): SeoKeywordBacklogRow[] {
  return rows
    .filter((row) => !filters.locale || row.locale === filters.locale)
    .filter((row) => !filters.contentType || row.content_type === filters.contentType)
    .filter((row) => !filters.status || row.status === filters.status)
    .sort((a, b) => b.priority - a.priority || String(a.created_at || "").localeCompare(String(b.created_at || "")));
}

export function slugifyKeyword(value: string): string {
  return value
    .toLowerCase()
    .replace(/°/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 90)
    .replace(/-+$/g, "");
}

export function buildUniqueSlug(keywordOrSlug: string, existingSlugs: Set<string>): string {
  const base = slugifyKeyword(keywordOrSlug);
  if (!existingSlugs.has(base)) return base;

  let suffix = 2;
  while (existingSlugs.has(`${base}-${suffix}`)) suffix++;
  return `${base}-${suffix}`;
}

export function isBacklogCandidate(row: Pick<SeoKeywordBacklogRow, "status" | "content_type" | "locale" | "priority">): boolean {
  return row.status === "new" && row.priority > 0 && row.locale.length > 0 && ["blog", "insight", "faq"].includes(row.content_type);
}

export function createCronBacklogRequests(day: number, locale = "en", count = 1): CronRequest[] {
  const contentType: SeoContentType | null = day === 2 || day === 5 ? "blog" : day === 3 ? "insight" : null;
  if (!contentType) return [];

  const path = contentType === "insight" ? "/api/seo/generate" : "/api/seo/generate-blog";
  return Array.from({ length: count }, () => ({
    path,
    body: { fromBacklog: "true", content_type: contentType, locale },
  }));
}

export async function claimNextBacklogItem(
  supabase: any,
  options: { contentType: SeoContentType; locale: string },
): Promise<SeoKeywordBacklogRow | null> {
  const { data, error } = await supabase
    .from("seo_keyword_backlog")
    .select("*")
    .eq("content_type", options.contentType)
    .eq("locale", options.locale)
    .eq("status", "new")
    .gt("priority", 0)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error && tableMissing(error)) {
    const rows = await readSettingsBacklog(supabase);
    const next = filterBacklogRows(rows, { contentType: options.contentType, locale: options.locale, status: "new" }).find(isBacklogCandidate);
    if (!next?.id) return null;
    const updatedRows = rows.map((row) => row.id === next.id ? { ...row, status: "selected" as const, picked_at: nowIso(), updated_at: nowIso() } : row);
    await writeSettingsBacklog(supabase, updatedRows);
    return updatedRows.find((row) => row.id === next.id) || null;
  }
  if (error) throw new Error(`Failed to read keyword backlog: ${error.message}`);
  if (!data) return null;

  const { data: updated, error: updateError } = await supabase
    .from("seo_keyword_backlog")
    .update({ status: "selected", picked_at: nowIso(), updated_at: nowIso() })
    .eq("id", data.id)
    .eq("status", "new")
    .select("*")
    .maybeSingle();

  if (updateError) throw new Error(`Failed to claim keyword backlog item: ${updateError.message}`);
  return updated || null;
}

export async function listBacklogItems(
  supabase: any,
  filters: { status?: string | null; contentType?: string | null; locale?: string },
): Promise<SeoKeywordBacklogRow[]> {
  let query = supabase
    .from("seo_keyword_backlog")
    .select("*")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true });

  if (filters.locale) query = query.eq("locale", filters.locale);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.contentType) query = query.eq("content_type", filters.contentType);

  const { data, error } = await query.limit(200);
  if (error && tableMissing(error)) {
    return filterBacklogRows(await readSettingsBacklog(supabase), filters);
  }
  if (error) throw new Error(error.message);
  return data || [];
}

export async function insertBacklogItem(supabase: any, row: SeoKeywordBacklogRow): Promise<SeoKeywordBacklogRow> {
  const payload = withDefaults(row);
  const { data, error } = await supabase.from("seo_keyword_backlog").insert(payload).select("*").single();
  if (error && tableMissing(error)) {
    const rows = await readSettingsBacklog(supabase);
    const exists = rows.some((item) => item.locale === payload.locale && item.content_type === payload.content_type && item.keyword === payload.keyword);
    if (exists) throw new Error("Keyword already exists in backlog");
    await writeSettingsBacklog(supabase, [payload, ...rows]);
    return payload;
  }
  if (error) throw new Error(error.message);
  return data;
}

export async function markBacklogPublished(
  supabase: any,
  id: string | undefined,
  result: { tableName: string; recordId: string; path: string; slug: string },
): Promise<void> {
  if (!id) return;
  const { error } = await supabase
    .from("seo_keyword_backlog")
    .update({
      status: "published",
      generated_table: result.tableName,
      generated_id: result.recordId,
      generated_path: result.path,
      slug: result.slug,
      generated_at: nowIso(),
      updated_at: nowIso(),
      last_error: "",
    })
    .eq("id", id);
  if (error && tableMissing(error)) {
    const rows = await readSettingsBacklog(supabase);
    await writeSettingsBacklog(supabase, rows.map((row) => row.id === id ? {
      ...row,
      status: "published",
      generated_table: result.tableName,
      generated_id: result.recordId,
      generated_path: result.path,
      slug: result.slug,
      generated_at: nowIso(),
      updated_at: nowIso(),
      last_error: "",
    } : row));
    return;
  }
  if (error) throw new Error(`Failed to mark keyword backlog published: ${error.message}`);
}

export async function markBacklogError(supabase: any, id: string | undefined, message: string): Promise<void> {
  if (!id) return;
  const { error } = await supabase
    .from("seo_keyword_backlog")
    .update({ status: "error", last_error: message.slice(0, 500), updated_at: nowIso() })
    .eq("id", id);
  if (error && tableMissing(error)) {
    const rows = await readSettingsBacklog(supabase);
    await writeSettingsBacklog(supabase, rows.map((row) => row.id === id ? {
      ...row,
      status: "error",
      last_error: message.slice(0, 500),
      updated_at: nowIso(),
    } : row));
    return;
  }
  if (error) throw new Error(`Failed to mark keyword backlog error: ${error.message}`);
}
