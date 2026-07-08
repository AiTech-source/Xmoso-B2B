import { createServerSupabaseClient } from "@/lib/supabase/server";

const noCache = { "Cache-Control": "no-store", "CDN-Cache-Control": "no-store" };

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "No DB" }, { status: 500, headers: noCache });

  // Verify caller is super_admin
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role || "admin";
  if (role !== "super_admin") {
    return Response.json({ error: "Only super admin can list users" }, { status: 403, headers: noCache });
  }

  // List all auth users (requires service_role)
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) return Response.json({ error: error.message }, { status: 500, headers: noCache });

  const users = (data?.users || []).map((u: any) => ({
    id: u.id,
    email: u.email,
    display_name: u.user_metadata?.display_name || u.email?.split("@")[0] || "",
    role: u.user_metadata?.role || "admin",
    is_active: u.user_metadata?.is_active !== false,
    created_at: u.created_at,
    last_sign_in: u.last_sign_in_at,
  }));

  return Response.json({ users }, { headers: noCache });
}

export async function POST(req: Request) {
  const { email, password, display_name, role } = await req.json();
  if (!email || !password) {
    return Response.json({ error: "Email and password required" }, { status: 400, headers: noCache });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "No DB" }, { status: 500, headers: noCache });

  // Verify caller is super_admin
  const { data: { user: caller } } = await supabase.auth.getUser();
  if (caller?.user_metadata?.role !== "super_admin") {
    return Response.json({ error: "Only super admin can create users" }, { status: 403, headers: noCache });
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: display_name || email.split("@")[0],
      role: role || "admin",
    },
  });

  if (error) return Response.json({ error: error.message }, { status: 500, headers: noCache });
  return Response.json({ user: data.user }, { headers: noCache });
}

export async function PUT(req: Request) {
  const { id, display_name, role, password, is_active } = await req.json();
  if (!id) return Response.json({ error: "User ID required" }, { status: 400, headers: noCache });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "No DB" }, { status: 500, headers: noCache });

  // Verify caller is super_admin
  const { data: { user: caller } } = await supabase.auth.getUser();
  if (caller?.user_metadata?.role !== "super_admin") {
    return Response.json({ error: "Only super admin can update users" }, { status: 403, headers: noCache });
  }

  const updates: any = {};
  if (display_name !== undefined || role !== undefined) {
    updates.user_metadata = {};
    if (display_name !== undefined) updates.user_metadata.display_name = display_name;
    if (role !== undefined) updates.user_metadata.role = role;
  }
  if (password !== undefined) updates.password = password;

  // Handle disable/enable via metadata
  if (is_active !== undefined) {
    updates.user_metadata = { ...updates.user_metadata, is_active };
  }

  const { error } = await supabase.auth.admin.updateUserById(id, updates);
  if (error) return Response.json({ error: error.message }, { status: 500, headers: noCache });

  return Response.json({ ok: true }, { headers: noCache });
}
