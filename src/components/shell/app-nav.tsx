"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function AppNav({ showAdmin }: { showAdmin: boolean }) {
  const pathname = usePathname();
  const t = useTranslations("nav");

  const items = [
    { href: "/app/dashboard", label: t("dashboard") },
    { href: "/app/atividades", label: t("activities") },
    ...(showAdmin ? [{ href: "/app/admin", label: t("admin") }] : []),
  ];

  return (
    <nav className="flex gap-1 border-b bg-card px-4 sm:px-6">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "border-b-2 px-3 py-3 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
