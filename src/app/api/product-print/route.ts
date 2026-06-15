import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const locale = searchParams.get("locale") || "en";

  if (!slug) return new Response("Slug required", { status: 400 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return new Response("No DB", { status: 500 });

  const { data: translation } = await supabase
    .from("product_translations")
    .select("*, product:products(*)")
    .eq("locale", locale).eq("slug", slug).single();

  if (!translation?.product) return new Response("Not found", { status: 404 });

  const product = translation.product;

  const { data: specRows } = await supabase
    .from("product_specs").select("*")
    .eq("product_id", product.id).order("sort_order");

  let catName = "";
  if (product.category_id) {
    const { data: cat } = await supabase
      .from("product_categories").select("name").eq("id", product.category_id).single();
    if (cat) catName = cat.name;
  }

  const specs = specRows || [];
  const highlights = product.highlights || [];
  const counters = product.param_counters || [];
  const model = product.model_number;
  const name = translation.name;
  const img = product.image_gallery?.[0]?.url || "";
  let logoUrl = "";
  const { data: logoSettings } = await supabase
    .from("site_settings").select("value").eq("key", "logo_url").single();
  if (logoSettings?.value) logoUrl = logoSettings.value;

  const specRowsHtml = specs.map((s: any, i: number) => `
    <div class="s-item ${i % 2 === 0 ? "" : "alt"}">
      <span class="s-lbl">${esc(s.label)}</span>
      <span class="s-val">${esc(s.value || "—")}</span>
    </div>
  `).join("");

  const highlightsHtml = highlights.map((h: string) =>
    `<li>${esc(h)}</li>`
  ).join("");

  const counterHtml = counters.map((c: any, i: number) => `
    <div class="s-item ${i % 2 === 0 ? "" : "alt"}">
      <span class="s-lbl">${esc(c.label || "")}</span>
      <span class="s-val">${esc(c.value || "")} ${esc(c.unit || "")}</span>
    </div>
  `).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(model)} — Spec Sheet</title>
<style>
  @page { margin: 15mm 12mm; size: A4 portrait; }
  @media print { .np { display:none!important; } body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Helvetica Neue',Arial,sans-serif; background:#fff; color:#222; line-height:1.5; padding:30px; }
  .bar { height:4px; background:linear-gradient(90deg,#2a7d4e,#7EC8E3); margin:-30px -30px 20px; }
  .hd { display:flex; justify-content:space-between; align-items:flex-end; padding:20px; background:#1a1a2e; border-radius:8px; margin-bottom:20px; }
  .hd-l .b { font-size:20px;font-weight:700;color:#8BC8A0;letter-spacing:2px; }
  .hd-l .t { font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:1px; }
  .hd-r { text-align:right; }
  .hd-r h1 { font-size:22px;font-weight:600;color:#fff; }
  .hd-r .sub { font-size:13px;color:rgba(255,255,255,0.6);margin-top:2px; }
  .hd-r .cat { font-size:11px;color:#8BC8A0;margin-top:1px;font-weight:500; }
  .hd-l { display:flex; align-items:center; gap:12px; }
  .hd-l .m { width:36px;height:36px;background:#2a7d4e;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px; }
  .tc { display:flex; gap:24px; margin-bottom:20px; }
  .ic { width:200px; min-height:150px; flex-shrink:0; background:#f5f0e8; border-radius:6px; display:flex; align-items:center; justify-content:center; padding:8px; }
  .ic img { max-width:100%; max-height:180px; object-fit:contain; }
  .if { flex:1; display:flex; flex-direction:column; gap:4px; }
  .ir { font-size:13px; color:#444; }
  .ir strong { color:#111; display:inline-block; min-width:120px; }
  .st { font-size:14px; font-weight:600; color:#2a7d4e; margin:18px 0 6px; padding-bottom:3px; border-bottom:1px solid #ddd; }
  .sg { display:grid; grid-template-columns:1fr 1fr; }
  .s-item { display:flex; padding:5px 8px; font-size:12px; border-bottom:1px solid #f0f0f0; }
  .s-item.alt { background:#fafafa; }
  .s-lbl { font-weight:500; color:#111; width:180px; flex-shrink:0; }
  .s-val { color:#444; }
  ul.hl { padding-left:20px; margin-top:6px; }
  ul.hl li { font-size:12px; color:#444; margin-bottom:3px; }
  .ft { margin-top:25px; padding-top:12px; border-top:1px solid #ddd; font-size:10px; color:#999; text-align:center; letter-spacing:0.5px; }
  .pb { background:#1a1a2e; padding:12px 20px; border-radius:8px; margin-bottom:16px; display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
  .pb .btn { padding:8px 20px; border-radius:6px; font-size:13px; cursor:pointer; border:none; font-weight:500; }
  .pb-p { background:#2a7d4e; color:#fff; }
  .pb-s { background:#eee; color:#333; border:1px solid #ccc!important; }
  .pb .h { font-size:12px; color:#888; margin-left:auto; }
</style></head>
<body>
<div class="bar"></div>
<div class="pb np">
  <button class="btn pb-p" onclick="window.print()">🖨️ Print / Save PDF</button>
  <button class="btn pb-s" onclick="window.close()">✕ Close</button>
  <span class="h">Ctrl+P to print · Save as PDF from print dialog</span>
</div>
<div class="hd">
  <div class="hd-l">${logoUrl ? `<img src="${esc(logoUrl)}" style="height:32px;max-width:120px;object-fit:contain" alt="Xmoso" />` : `<div class="m">X</div>`}<div><div class="b">XMOSO</div><div class="t">SPECIFICATION SHEET</div></div></div>
  <div class="hd-r"><h1>${esc(name)}</h1><div class="sub">${esc(model)}</div>${catName ? `<div class="cat">${esc(catName)}</div>` : ""}</div>
</div>
<div class="tc">
  ${img ? `<div class="ic"><img src="${esc(img)}" alt="${esc(name)}" /></div>` : `<div class="ic" style="color:#ccc;font-size:28px">🍷</div>`}
  <div class="if">
    <div class="ir"><strong>Model Number</strong> ${esc(model)}</div>
    <div class="ir"><strong>Product Name</strong> ${esc(name)}</div>
    ${catName ? `<div class="ir"><strong>Category</strong> ${esc(catName)}</div>` : ""}
    ${product.product_style ? `<div class="ir"><strong>Style</strong> ${esc(product.product_style)}</div>` : ""}
    ${product.energy_rating ? `<div class="ir"><strong>Energy Rating</strong> ${esc(product.energy_rating)}</div>` : ""}
  </div>
</div>
${specs.length > 0 ? `<div class="st">Technical Specifications</div><div class="sg">${specRowsHtml}</div>` : ""}
${highlights.length > 0 ? `<div class="st">Key Features</div><ul class="hl">${highlightsHtml}</ul>` : ""}
${counters.length > 0 ? `<div class="st">Key Parameters</div><div class="sg">${counterHtml}</div>` : ""}
<div class="ft">XMOSO TECH. CO., LTD. — ${new Date().toISOString().slice(0, 10)} — xmoso.com</div>
</body></html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
