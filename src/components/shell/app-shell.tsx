"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
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
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
        <header className="flex h-14 items-center gap-3 border-b bg-card px-4 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label={tSidebar("openMenu")}
            className="rounded-md p-1.5 text-foreground hover:bg-muted"
          >
            <Menu className="size-5" />
          </button>
          <span className="text-sm font-bold text-brand-purple">Multilaser TDL</span>
        </header>
        <main className="flex-1 bg-muted/40 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
