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
      supabase.from("activities").select("*").order("priority", { ascending: false }),
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
