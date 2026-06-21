import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendInquiryEmail } from "@/lib/email/send";

export async function POST(req: Request) {
  const body = await req.json();
  const { name, email, company, phone, message, product_id, locale, page_url } = body;

  if (!name || !email) {
    return Response.json({ error: "Name and email required" }, { status: 400 });
  }

  // Basic spam detection
  const msgLower = (message || "").toLowerCase() + " " + (name || "").toLowerCase();
  const isSpam = msgLower.includes("http://") || msgLower.includes("https://") ||
    (msgLower.includes("buy") && msgLower.includes("visit")) ||
    msgLower.split(/\s+/).filter(Boolean).length > 80;

  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "No client" }, { status: 500 });

  // Insert inquiry
  const { data: inquiry, error } = await supabase
    .from("inquiries")
    .insert({
      name, email, company: company || "", phone: phone || "", message: message || "",
      product_id: product_id || null, locale: locale || "en", page_url: page_url || "",
      utm_source: body.utm_source || "", utm_medium: body.utm_medium || "", utm_campaign: body.utm_campaign || "", is_spam: isSpam,
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Try to send email — non-blocking, doesn't fail the request
  let product_name = "";
  let model_number = "";
  if (product_id) {
    const { data: product } = await supabase
      .from("products")
      .select("model_number")
      .eq("id", product_id)
      .single();
    if (product) {
      model_number = product.model_number;
      const { data: trans } = await supabase
        .from("product_translations")
        .select("name")
        .eq("product_id", product_id)
        .eq("locale", locale || "en")
        .maybeSingle();
      if (trans) product_name = trans.name;
    }
  }

  const emailResult = await sendInquiryEmail(supabase, {
    name, email, company, phone, message,
    product_name, model_number, page_url, locale,
  });

  return Response.json({
    ok: true,
    id: inquiry?.id,
    email_sent: emailResult.success,
    email_error: emailResult.error || null,
  });
}
