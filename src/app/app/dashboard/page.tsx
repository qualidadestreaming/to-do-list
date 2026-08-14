import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getCachedActivities, getCachedDepartmentUsers } from "@/lib/data/activities";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [{ activities, error: activitiesError }, { users, error: usersError }] = await Promise.all([
    getCachedActivities(session.departmentId),
    getCachedDepartmentUsers(session.departmentId),
  ]);

  return (
    <DashboardView
      activities={activities}
      users={users}
      currentUserId={session.userId}
      currentUserName={session.userName}
      departmentName={session.departmentName}
      loadError={activitiesError || usersError}
    />
  );
}
