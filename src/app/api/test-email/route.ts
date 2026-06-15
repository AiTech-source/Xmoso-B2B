import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendInquiryEmail } from "@/lib/email/send";

export async function POST() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "No DB" }, { status: 500 });

  // Read SMTP settings to verify they exist
  const keys = ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_secure", "notification_email"];
  const { data: rows } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", keys);

  const settings: Record<string, string> = {};
  for (const row of rows || []) {
    settings[row.key] = row.value;
  }

  const missing = keys.filter((k) => !settings[k]);
  if (missing.length > 0) {
    return Response.json({
      error: `Missing settings: ${missing.join(", ")}`,
      settings: Object.fromEntries(keys.map((k) => [k, settings[k] ? settings[k].substring(0, 3) + "..." : "(empty)"])),
    }, { status: 400 });
  }

  // Try sending a test email
  const result = await sendInquiryEmail(supabase, {
    name: "Test User",
    email: settings.notification_email || "test@example.com",
    company: "Test Company",
    phone: "+1234567890",
    message: "This is a test email to verify SMTP configuration.",
    page_url: "/admin/settings",
    locale: "en",
  });

  return Response.json({
    success: result.success,
    error: result.error || null,
    settings: Object.fromEntries(keys.map((k) => [k, settings[k] ? settings[k].substring(0, 3) + "..." : "(empty)"])),
  });
}
