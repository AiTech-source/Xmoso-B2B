import { createServerSupabaseClient } from "@/lib/supabase/server";

const noCache = { "Cache-Control": "no-store", "CDN-Cache-Control": "no-store" };

export async function PUT(req: Request) {
  const { display_name, current_password, new_password } = await req.json();

  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "No DB" }, { status: 500, headers: noCache });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Not authenticated" }, { status: 401, headers: noCache });

  // Update display name
  if (display_name !== undefined) {
    const { error } = await supabase.auth.updateUser({
      data: { display_name },
    });
    if (error) return Response.json({ error: error.message }, { status: 500, headers: noCache });
  }

  // Update password (requires current password verification)
  if (new_password) {
    if (!current_password) {
      return Response.json({ error: "Current password is required to set a new password" }, { status: 400, headers: noCache });
    }
    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: current_password,
    });
    if (signInError) {
      return Response.json({ error: "Current password is incorrect" }, { status: 403, headers: noCache });
    }
    const { error } = await supabase.auth.updateUser({ password: new_password });
    if (error) return Response.json({ error: error.message }, { status: 500, headers: noCache });
  }

  return Response.json({ ok: true, email: user.email, display_name: display_name || user.user_metadata?.display_name }, { headers: noCache });
}
