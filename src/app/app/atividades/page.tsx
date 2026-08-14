import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getCachedActivities, getCachedDepartmentUsers } from "@/lib/data/activities";
import { ActivitiesView } from "@/components/activities/activities-view";

export default async function AtividadesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [{ activities, error: activitiesError }, { users, error: usersError }] = await Promise.all([
    getCachedActivities(session.departmentId),
    getCachedDepartmentUsers(session.departmentId),
  ]);

  return (
    <ActivitiesView
      initialActivities={activities}
      users={users}
      currentUserId={session.userId}
      loadError={activitiesError || usersError}
    />
  );
}
