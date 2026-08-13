import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { fetchDepartmentOptions } from "@/lib/actions/auth-actions";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/app/dashboard");

  const departments = await fetchDepartmentOptions();

  return (
    <main className="flex flex-1 items-center justify-center bg-muted p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-fit items-center justify-center rounded-xl bg-brand-purple px-4 text-lg font-bold tracking-tight text-white">
            Multilaser
          </div>
          <h1 className="text-xl font-semibold text-foreground">TDL Multilaser</h1>
          <p className="text-sm text-muted-foreground">
            Gestão de atividades prioritárias por departamento
          </p>
        </div>
        <LoginForm departments={departments} />
      </div>
    </main>
  );
}
