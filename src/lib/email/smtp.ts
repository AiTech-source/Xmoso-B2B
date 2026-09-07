import nodemailer from "nodemailer";
import type { SupabaseClient } from "@supabase/supabase-js";

const SMTP_KEYS = ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_secure", "notification_email"];

export interface HtmlEmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
}

interface SiteSettingRow {
  key: string;
  value: string;
}

export async function readSmtpSettings(supabase: SupabaseClient): Promise<Record<string, string>> {
  const { data: rows } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", SMTP_KEYS);

  const settings: Record<string, string> = {};
  for (const row of (rows as SiteSettingRow[] | null) || []) {
    settings[row.key] = row.value;
  }
  return settings;
}

export async function sendHtmlEmailWithSettings(
  supabase: SupabaseClient,
  { to, subject, html, text, fromName = "Xmoso" }: HtmlEmailMessage,
): Promise<{ success: boolean; error?: string }> {
  const settings = await readSmtpSettings(supabase);
  const host = settings.smtp_host;
  const port = settings.smtp_port;
  const user = settings.smtp_user;
  const pass = settings.smtp_pass;

  if (!host || !user || !pass || !to) {
    return { success: false, error: "SMTP not configured" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number.parseInt(port || "587", 10),
      secure: settings.smtp_secure === "true",
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"${fromName}" <${user}>`,
      to, subject, html, text,
    });

    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Email send failed",
    };
  }
}
