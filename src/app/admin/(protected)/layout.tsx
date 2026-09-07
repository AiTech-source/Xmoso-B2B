import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAdminRole } from "@/lib/admin-roles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    redirect("/admin/login");
    return null;
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
    return null;
  }

  if (!getAdminRole(user)) {
    redirect("/admin/login");
    return null;
  }

  return <>{children}</>;
}
