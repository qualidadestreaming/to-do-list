import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { fetchDepartmentOptions } from "@/lib/actions/auth-actions";
import { LoginScreen } from "@/components/auth/login-screen";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/app/dashboard");

  const departments = await fetchDepartmentOptions();

  return <LoginScreen departments={departments} />;
}
