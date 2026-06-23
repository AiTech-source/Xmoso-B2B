import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

  const role = user.user_metadata?.role;
  if (role !== "super_admin" && role !== "admin" && role !== "editor") {
    redirect("/admin/login");
    return null;
  }

  return <>{children}</>;
}
