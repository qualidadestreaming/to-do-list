import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { createSessionClient } from "@/lib/supabase/server";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import type { Activity, AppUser } from "@/types/database";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const supabase = await createSessionClient();

  const [{ data: activities, error: activitiesError }, { data: users, error: usersError }] =
    await Promise.all([
      supabase.from("activities").select("*"),
      supabase.from("users").select("*").eq("active", true).order("name"),
    ]);

  const hasError = Boolean(activitiesError || usersError);

  return (
    <DashboardView
      activities={(activities ?? []) as Activity[]}
      users={(users ?? []) as AppUser[]}
      loadError={hasError}
    />
  );
}
