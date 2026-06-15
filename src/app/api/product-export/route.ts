import { createServerSupabaseClient } from "@/lib/supabase/server";
import * as XLSX from "xlsx";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const locale = searchParams.get("locale") || "en";
  const format = searchParams.get("format") || "xlsx";

  if (!slug) return Response.json({ error: "Slug required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "No client" }, { status: 500 });

  // Fetch product + translation
  const { data: translation } = await supabase
    .from("product_translations")
    .select("*, product:products(*)")
    .eq("locale", locale)
    .eq("slug", slug)
    .single();

  if (!translation?.product) return Response.json({ error: "Not found" }, { status: 404 });

  const product = translation.product;

  // Fetch specs
  const { data: specRows } = await supabase
    .from("product_specs")
    .select("*")
    .eq("product_id", product.id)
    .order("sort_order", { ascending: true });

  // Fetch category
  let categoryName = "";
  if (product.category_id) {
    const { data: cat } = await supabase
      .from("product_categories")
      .select("name")
      .eq("id", product.category_id)
      .single();
    if (cat) categoryName = cat.name;
  }

  // Build data rows
  const specs = (specRows || []).map((s: any) => ({ label: s.label, value: s.value }));
  const highlights = product.highlights || [];
  const counters = product.param_counters || [];

  // Excel row data: each spec is a row
  const rows: any[] = [];
  rows.push({ Field: "Model Number", Value: product.model_number });
  rows.push({ Field: "Product Name", Value: translation.name });
  if (categoryName) rows.push({ Field: "Category", Value: categoryName });
  if (product.product_style) rows.push({ Field: "Style", Value: product.product_style });
  if (product.energy_rating) rows.push({ Field: "Energy Rating", Value: product.energy_rating });
  rows.push({ Field: "", Value: "" });
  rows.push({ Field: "--- Specifications ---", Value: "" });
  for (const spec of specs) {
    rows.push({ Field: spec.label, Value: spec.value });
  }
  if (highlights.length > 0) {
    rows.push({ Field: "", Value: "" });
    rows.push({ Field: "--- Highlights ---", Value: "" });
    for (const h of highlights) {
      rows.push({ Field: "Highlight", Value: h });
    }
  }
  if (counters.length > 0) {
    rows.push({ Field: "", Value: "" });
    rows.push({ Field: "--- Key Parameters ---", Value: "" });
    for (const c of counters) {
      rows.push({ Field: c.label || "", Value: `${c.value || ""} ${c.unit || ""}`.trim() });
    }
  }

  const filename = `${product.model_number}-spec-sheet`.replace(/[^a-zA-Z0-9-_]/g, "-");

  if (format === "csv") {
    const ws = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
      },
    });
  }

  // Default: xlsx
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Spec Sheet");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
    },
  });
}
