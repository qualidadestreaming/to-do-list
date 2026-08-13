import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function AdminPage() {
  const session = await getSession();
  if (session?.userRole !== "gestor") redirect("/app/dashboard");

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Administração</h1>
      <p className="text-sm text-muted-foreground">Implementado na Fase 6.</p>
    </div>
  );
}
