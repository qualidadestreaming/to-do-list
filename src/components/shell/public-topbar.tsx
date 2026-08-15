"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";

export function PublicTopbar() {
  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-sidebar-border bg-sidebar px-4 text-sidebar-foreground sm:px-6">
      <span className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-purple to-brand-blue text-sm font-bold text-white">
          M
        </span>
        <span className="text-sm font-bold tracking-tight">
          grupo<span className="text-brand-purple">Multilaser</span>
        </span>
      </span>
      <div className="flex items-center gap-1 sm:gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
