"use client";

import { useTranslations } from "next-intl";
import { PublicTopbar } from "@/components/shell/public-topbar";
import { LoginForm } from "@/components/auth/login-form";
import type { DepartmentOption } from "@/lib/actions/auth-actions";

export function LoginScreen({ departments }: { departments: DepartmentOption[] }) {
  const t = useTranslations();

  return (
    <div className="flex min-h-svh flex-col">
      <PublicTopbar />
      <main className="flex flex-1 items-center justify-center bg-muted p-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-foreground">{t("app.name")}</h1>
            <p className="text-sm text-muted-foreground">{t("auth.subtitle")}</p>
          </div>
          <LoginForm departments={departments} />
        </div>
      </main>
    </div>
  );
}
