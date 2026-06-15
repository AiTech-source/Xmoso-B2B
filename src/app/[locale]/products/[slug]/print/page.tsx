import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function ProductPrintPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const supabase = await createServerSupabaseClient();

  // Fetch translation + product
  const { data: translation } = await supabase
    ?.from("product_translations")
    .select("*, product:products(*)")
    .eq("locale", locale).eq("slug", slug)
    .single();

  if (!translation?.product) notFound();
  const product = translation.product;

  // Specs
  const { data: specRows } = await supabase
    ?.from("product_specs")
    .select("*")
    .eq("product_id", product.id)
    .order("sort_order");

  // Category
  let categoryName = "";
  if (product.category_id) {
    const { data: cat } = await supabase
      ?.from("product_categories").select("name").eq("id", product.category_id).single();
    if (cat) categoryName = cat.name;
  }

  const specs = specRows || [];
  const highlights = product.highlights || [];
  const counters = product.param_counters || [];
  const model = product.model_number;
  const name = translation.name;
  const mainImage = product.image_gallery?.[0]?.url || "";

  return (
    <html>
      <head>
        <title>{model} — Spec Sheet</title>
        <style>{`
          @page { margin: 20mm 15mm; size: A4 portrait; }
          @media print {
            .no-print { display: none !important; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; background: #fff; color: #222; line-height: 1.5; padding: 20px 30px; }
          .header { display: flex; align-items: flex-start; gap: 30px; padding-bottom: 20px; border-bottom: 3px solid #2a7d4e; margin-bottom: 20px; }
          .header-logo { font-size: 22px; font-weight: 700; color: #2a7d4e; letter-spacing: 2px; }
          .header-right { flex: 1; text-align: right; }
          .header-right h1 { font-size: 26px; font-weight: 600; color: #111; }
          .header-right .model { font-size: 14px; color: #555; margin-top: 4px; }
          .header-right .cat { font-size: 12px; color: #2a7d4e; margin-top: 2px; font-weight: 500; }
          .two-col { display: flex; gap: 30px; margin-bottom: 20px; }
          .image-col { width: 240px; flex-shrink: 0; }
          .image-col img { width: 100%; border-radius: 8px; background: #f5f0e8; padding: 10px; }
          .info-col { flex: 1; }
          .info-col p { margin-bottom: 6px; font-size: 13px; color: #444; }
          .info-col strong { color: #111; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { text-align: left; padding: 7px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; border-bottom: 1px solid #ddd; font-weight: 500; }
          td { padding: 7px 10px; font-size: 13px; border-bottom: 1px solid #eee; color: #333; }
          td:first-child { font-weight: 500; color: #111; width: 220px; }
          .section-title { font-size: 15px; font-weight: 600; color: #2a7d4e; margin: 20px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #2a7d4e; }
          .highlights li { font-size: 13px; color: #444; margin-bottom: 4px; }
          .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 11px; color: #999; text-align: center; }
          .no-print { margin-top: 10px; padding: 10px 20px; background: #2a7d4e; color: #fff; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; display: inline-block; }
          .no-print:hover { background: #1e5e3a; }
          .spec-label-col { width: 220px; font-weight: 500; color: #111; }
        `}</style>
      </head>
      <body>
        {/* Print button — hidden when printing */}
        <div className="no-print" style={{ marginBottom: 15 }}>
          <button onClick={() => window.print()} style={{ padding: "8px 20px", background: "#2a7d4e", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>
            🖨️ Print / Save PDF
          </button>
          &nbsp;
          <button onClick={() => window.close()} style={{ padding: "8px 20px", background: "#eee", color: "#333", border: "1px solid #ccc", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>
            ✕ Close
          </button>
        </div>

        {/* Header */}
        <div className="header">
          <div>
            <div className="header-logo">XMOSO</div>
            <div style={{ fontSize: 10, color: "#999", letterSpacing: 1 }}>SPECIFICATION SHEET</div>
          </div>
          <div className="header-right">
            <h1>{name}</h1>
            <div className="model">{model}</div>
            {categoryName && <div className="cat">{categoryName}</div>}
          </div>
        </div>

        {/* Image + Key Info */}
        <div className="two-col">
          {mainImage && (
            <div className="image-col">
              <img src={mainImage} alt={name} />
            </div>
          )}
          <div className="info-col">
            <p><strong>Model Number:</strong> {model}</p>
            <p><strong>Product Name:</strong> {name}</p>
            {categoryName && <p><strong>Category:</strong> {categoryName}</p>}
            {product.product_style && <p><strong>Style:</strong> {product.product_style}</p>}
            {product.energy_rating && <p><strong>Energy Rating:</strong> {product.energy_rating}</p>}
          </div>
        </div>

        {/* Specifications */}
        {specs.length > 0 && (
          <>
            <div className="section-title">Technical Specifications</div>
            <table>
              <thead><tr><th>Specification</th><th>Value</th></tr></thead>
              <tbody>
                {specs.map((s: any, i: number) => (
                  <tr key={i}>
                    <td>{s.label}</td>
                    <td>{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Highlights */}
        {highlights.length > 0 && (
          <>
            <div className="section-title">Key Features</div>
            <ul className="highlights" style={{ paddingLeft: 20, marginTop: 8 }}>
              {highlights.map((h: string, i: number) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </>
        )}

        {/* Param Counters */}
        {counters.length > 0 && (
          <>
            <div className="section-title">Key Parameters</div>
            <table>
              <thead><tr><th>Parameter</th><th>Value</th></tr></thead>
              <tbody>
                {counters.map((c: any, i: number) => (
                  <tr key={i}>
                    <td>{c.label || ""}</td>
                    <td>{c.value || ""} {c.unit || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Footer */}
        <div className="footer">
          XMOSO TECH. CO., LTD. — {new Date().toISOString().slice(0, 10)} — xmoso.com
        </div>
      </body>
    </html>
  );
}
