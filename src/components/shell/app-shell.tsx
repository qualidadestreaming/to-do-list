"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Sidebar } from "@/components/shell/sidebar";
import type { SessionPayload } from "@/lib/auth/session";

const COLLAPSE_STORAGE_KEY = "tdl_sidebar_collapsed";

export function AppShell({
  session,
  showAdmin,
  children,
}: {
  session: SessionPayload;
  showAdmin: boolean;
  children: ReactNode;
}) {
  const tSidebar = useTranslations("sidebar");
  const tNav = useTranslations("nav");
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const pageTitle = pathname.startsWith("/app/admin")
    ? tNav("admin")
    : pathname.startsWith("/app/atividades")
      ? tNav("activities")
      : tNav("dashboard");

  useEffect(() => {
    if (localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1") setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className="flex min-h-svh">
      <Sidebar
        session={session}
        showAdmin={showAdmin}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-card px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label={tSidebar("openMenu")}
            className="rounded-md p-1.5 text-foreground hover:bg-muted md:hidden"
          >
            <Menu className="size-5" />
          </button>
          <h2 className="truncate text-sm font-bold text-foreground sm:text-base">{pageTitle}</h2>
          <span className="hidden truncate text-xs text-muted-foreground sm:inline">
            {session.departmentName}
          </span>
        </header>
        <main className="flex-1 bg-muted/40 px-4 pt-3 pb-4 sm:px-6 sm:pt-4 sm:pb-6">{children}</main>
      </div>
    </div>
  );
}
