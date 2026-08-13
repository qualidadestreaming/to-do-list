"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LogoutButton } from "@/components/shell/logout-button";
import type { SessionPayload } from "@/lib/auth/session";

export function Topbar({ session }: { session: SessionPayload }) {
  const t = useTranslations("topbar");
  const tAuth = useTranslations("auth");

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-sidebar-border bg-sidebar px-4 text-sidebar-foreground sm:px-6">
      <Link href="/app/dashboard" className="flex shrink-0 items-center gap-2">
        <span className="flex h-9 w-fit items-center rounded-lg bg-white/10 px-3 text-sm font-bold tracking-tight">
          Multilaser
        </span>
        <span className="hidden text-sm font-medium text-sidebar-foreground/80 sm:inline">
          TDL
        </span>
      </Link>

      <div className="flex items-center gap-1 sm:gap-2">
        <div className="mr-2 hidden text-right text-xs leading-tight text-sidebar-foreground/70 sm:block">
          <div>{t("loggedInAs")}</div>
          <div className="font-medium text-sidebar-foreground">
            {session.userName}
            {session.userRole === "gestor" ? ` · ${tAuth("manager")}` : ""}
          </div>
        </div>
        <LanguageSwitcher />
        <ThemeToggle />
        <LogoutButton />
      </div>
    </header>
  );
}
