import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { createSessionClient } from "@/lib/supabase/server";
import { ActivitiesView } from "@/components/activities/activities-view";
import type { Activity, AppUser } from "@/types/database";

export default async function AtividadesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const supabase = await createSessionClient();

  const [{ data: activities, error: activitiesError }, { data: users, error: usersError }] =
    await Promise.all([
      // .range() é necessário — sem isso o PostgREST corta silenciosamente em
      // 1000 linhas (default do Supabase).
      supabase.from("activities").select("*").order("priority", { ascending: false }).range(0, 9999),
      supabase.from("users").select("*").eq("active", true).order("name"),
    ]);

  const hasError = Boolean(activitiesError || usersError);

  return (
    <ActivitiesView
      initialActivities={(activities ?? []) as Activity[]}
      users={(users ?? []) as AppUser[]}
      currentUserId={session.userId}
      loadError={hasError}
    />
  );
}
