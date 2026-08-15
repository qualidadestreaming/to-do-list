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
        <div className="w-full max-w-sm space-y-7">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-brand-blue text-2xl font-bold text-white shadow-[var(--shadow-card)]">
              M
            </div>
            <h1 className="text-xl font-bold text-foreground">{t("app.name")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("auth.subtitle")}</p>
          </div>
          <LoginForm departments={departments} />
        </div>
      </main>
    </div>
  );
}
