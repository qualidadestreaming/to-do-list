"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  ListChecks,
  ShieldCheck,
  Users2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LogoutButton } from "@/components/shell/logout-button";
import { SwitchUserDialog } from "@/components/shell/switch-user-dialog";
import type { SessionPayload } from "@/lib/auth/session";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function Sidebar({
  session,
  showAdmin,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
}: {
  session: SessionPayload;
  showAdmin: boolean;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tSidebar = useTranslations("sidebar");
  const [switchOpen, setSwitchOpen] = useState(false);

  const items = [
    { href: "/app/dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { href: "/app/atividades", label: t("activities"), icon: ListChecks },
    ...(showAdmin ? [{ href: "/app/admin", label: t("admin"), icon: ShieldCheck }] : []),
  ];

  return (
    <>
      {mobileOpen && (
        <button
          aria-label={tSidebar("closeMenu")}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 md:sticky md:top-0 md:h-svh md:translate-x-0",
          collapsed ? "md:w-16" : "md:w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-sm font-bold">
            M
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight">Multilaser</p>
              <p className="truncate text-[11px] leading-tight text-sidebar-foreground/60">TDL</p>
            </div>
          )}
          <button
            type="button"
            className="ml-auto rounded-md p-1 text-sidebar-foreground/70 hover:bg-white/10 md:hidden"
            onClick={onCloseMobile}
            aria-label={tSidebar("closeMenu")}
          >
            <X className="size-4" />
          </button>
        </div>

        {!collapsed && (
          <div className="mx-3 mb-4 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-sidebar-foreground/50">
              {tSidebar("department")}
            </p>
            <p className="truncate text-sm font-semibold">{session.departmentName}</p>
          </div>
        )}

        <nav className="flex flex-col gap-1 px-3">
          {items.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                onClick={onCloseMobile}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-white text-sidebar"
                    : "text-sidebar-foreground/80 hover:bg-white/10 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="size-[18px] shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        <div className="hidden border-t border-white/10 p-2 md:block">
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? tSidebar("expand") : tSidebar("collapse")}
            className="flex w-full items-center justify-center rounded-lg p-2 text-sidebar-foreground/70 hover:bg-white/10"
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
        </div>

        <div className="border-t border-white/10 p-3">
          {!collapsed && (
            <button
              type="button"
              onClick={() => setSwitchOpen(true)}
              title={tSidebar("switchUser")}
              className="mb-2 flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left hover:bg-white/10"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold">
                {initials(session.userName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{session.userName}</p>
                <p className="truncate text-[11px] text-sidebar-foreground/60">
                  {session.userRole === "gestor" ? "Gestor" : "Colaborador"}
                </p>
              </div>
              <Users2 className="size-4 shrink-0 text-sidebar-foreground/50" />
            </button>
          )}
          {collapsed && (
            <button
              type="button"
              onClick={() => setSwitchOpen(true)}
              title={tSidebar("switchUser")}
              className="mb-2 flex w-full items-center justify-center rounded-lg p-2 text-sidebar-foreground/70 hover:bg-white/10"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-[11px] font-bold">
                {initials(session.userName)}
              </div>
            </button>
          )}
          <div className={cn("flex gap-1", collapsed ? "flex-col items-center" : "")}>
            <LanguageSwitcher />
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </aside>

      <SwitchUserDialog
        open={switchOpen}
        onOpenChange={setSwitchOpen}
        departmentName={session.departmentName}
        currentUserId={session.userId}
      />
    </>
  );
}
