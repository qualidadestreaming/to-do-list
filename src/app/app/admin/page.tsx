import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { createSessionClient } from "@/lib/supabase/server";
import { AdminView } from "@/components/admin/admin-view";
import type { AppUser } from "@/types/database";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.userRole !== "gestor") redirect("/app/dashboard");

  const supabase = await createSessionClient();
  const { data: users } = await supabase.from("users").select("*").order("name");

  return <AdminView users={(users ?? []) as AppUser[]} />;
}
