import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAdminRole } from "@/lib/admin-roles";

export const noCacheHeaders = {
  "Cache-Control": "no-store",
  "CDN-Cache-Control": "no-store",
};

export interface AdminAuthResult {
  supabase: SupabaseClient;
  user: User;
  role: string;
}

export async function getAdminUser(): Promise<AdminAuthResult | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = getAdminRole(user);
  if (!user || !role) return null;

  return { supabase, user, role };
}

export function adminRequiredResponse(message = "Admin authentication required"): Response {
  return Response.json({ error: message }, { status: 401, headers: noCacheHeaders });
}
