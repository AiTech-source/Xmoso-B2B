import type { User } from "@supabase/supabase-js";

type RoleMetadata = {
  role?: unknown;
};

const ADMIN_ROLES = new Set(["super_admin", "admin", "editor"]);

export function getAdminRole(user: User | null | undefined): string {
  const appMetadata = user?.app_metadata as RoleMetadata | undefined;
  const userMetadata = user?.user_metadata as RoleMetadata | undefined;
  const role = String(appMetadata?.role || userMetadata?.role || "");
  return ADMIN_ROLES.has(role) ? role : "";
}
