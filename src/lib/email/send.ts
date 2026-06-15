import nodemailer from "nodemailer";
import type { SupabaseClient } from "@supabase/supabase-js";

interface InquiryEmailData {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  message?: string;
  product_name?: string;
  model_number?: string;
  page_url?: string;
  locale?: string;
  created_at?: string;
}

export async function sendInquiryEmail(
  supabase: SupabaseClient<any>,
  data: InquiryEmailData,
): Promise<{ success: boolean; error?: string }> {
  // Read SMTP settings + notification email from site_settings
  const keys = ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_secure", "notification_email"];
  const { data: rows } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", keys);

  const settings: Record<string, string> = {};
  for (const row of rows || []) {
    settings[row.key] = row.value;
  }

  const host = settings.smtp_host;
  const port = settings.smtp_port;
  const user = settings.smtp_user;
  const pass = settings.smtp_pass;
  const to = settings.notification_email;

  if (!host || !user || !pass || !to) {
    return { success: false, error: "SMTP not configured" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port || "587"),
      secure: settings.smtp_secure === "true",
      auth: { user, pass },
    });

    const subject = `📩 New Inquiry from ${data.name}`;

    const html = buildEmailHtml(data);

    await transporter.sendMail({
      from: `"Xmoso Inquiries" <${user}>`,
      to,
      subject,
      html,
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildEmailHtml(data: InquiryEmailData): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="background:#0A0A0F;color:#C0C0C0;font-family:Inter,sans-serif;padding:40px;margin:0">
<div style="max-width:560px;margin:auto;background:#1A1A2E;border-radius:12px;overflow:hidden;border:1px solid rgba(192,192,192,0.1)">
  <div style="padding:24px 32px;background:#0A0A0F;border-bottom:1px solid rgba(192,192,192,0.1)">
    <span style="color:#8BC8A0;font-size:20px;font-weight:600">Xmoso</span>
    <span style="color:rgba(192,192,192,0.4);font-size:13px;margin-left:12px">— New Inquiry</span>
  </div>
  <div style="padding:32px">
    <h2 style="color:#ffffff;font-size:18px;font-weight:400;margin:0 0 24px">📋 Contact Details</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <tr><td style="color:rgba(192,192,192,0.4);padding:6px 0;width:80px">Name</td><td style="color:#ffffff;padding:6px 0">${escapeHtml(data.name)}</td></tr>
      <tr><td style="color:rgba(192,192,192,0.4);padding:6px 0">Email</td><td style="color:#7EC8E3;padding:6px 0"><a href="mailto:${escapeHtml(data.email)}" style="color:#7EC8E3">${escapeHtml(data.email)}</a></td></tr>
      <tr><td style="color:rgba(192,192,192,0.4);padding:6px 0">Company</td><td style="color:#ffffff;padding:6px 0">${escapeHtml(data.company || "—")}</td></tr>
      <tr><td style="color:rgba(192,192,192,0.4);padding:6px 0">Phone</td><td style="color:#ffffff;padding:6px 0">${escapeHtml(data.phone || "—")}</td></tr>
    </table>
    ${data.message ? `
    <h2 style="color:#ffffff;font-size:18px;font-weight:400;margin:24px 0 12px">💬 Message</h2>
    <p style="background:#0A0A0F;border-radius:8px;padding:16px;color:rgba(255,255,255,0.8);font-size:13px;line-height:1.6;margin:0">${escapeHtml(data.message)}</p>
    ` : ""}
    ${data.product_name ? `<p style="margin-top:24px;font-size:13px;color:rgba(192,192,192,0.5)">📎 Product: ${escapeHtml(data.product_name)} ${data.model_number ? "(" + escapeHtml(data.model_number) + ")" : ""}</p>` : ""}
    ${data.page_url ? `<p style="font-size:13px;color:rgba(192,192,192,0.5)">🌐 Page: <a href="https://xmoso.com${escapeHtml(data.page_url)}" style="color:#7EC8E3">${escapeHtml(data.page_url)}</a></p>` : ""}
    <p style="font-size:12px;color:rgba(192,192,192,0.3);margin-top:24px">🕐 ${new Date().toISOString().slice(0, 19).replace("T", " ")}</p>
    <div style="margin-top:24px;text-align:center">
      <a href="https://xmoso.com/admin/inquiries" style="display:inline-block;padding:10px 24px;background:#8BC8A0;color:#0A0A0F;text-decoration:none;border-radius:8px;font-size:13px;font-weight:500">→ View in Admin</a>
    </div>
  </div>
</div></body></html>`;
}
