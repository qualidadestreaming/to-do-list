"use client";

import { Languages } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/config";
import { LOCALE_LABELS, LOCALES } from "@/lib/i18n/config";

export function LanguageSwitcher() {
  const t = useTranslations("topbar");
  const { locale, setLocale } = useLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
          aria-label={t("language")}
        >
          <Languages className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => setLocale(l as Locale)}
            className={l === locale ? "font-semibold text-primary" : undefined}
          >
            {LOCALE_LABELS[l as Locale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
