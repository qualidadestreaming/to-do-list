import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Topbar } from "@/components/shell/topbar";
import { AppNav } from "@/components/shell/app-nav";

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-svh flex-col">
      <Topbar session={session} />
      <AppNav showAdmin={session.userRole === "gestor"} />
      <main className="flex-1 bg-muted/40 p-4 sm:p-6">{children}</main>
    </div>
  );
}
