import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AppShell } from "@/components/shell/app-shell";

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <AppShell session={session} showAdmin={session.userRole === "gestor"}>
      {children}
    </AppShell>
  );
}
