"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";

export function PublicTopbar() {
  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-sidebar-border bg-sidebar px-4 text-sidebar-foreground sm:px-6">
      <span className="flex h-9 w-fit items-center rounded-lg bg-white/10 px-3 text-sm font-bold tracking-tight">
        Multilaser
      </span>
      <div className="flex items-center gap-1 sm:gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
