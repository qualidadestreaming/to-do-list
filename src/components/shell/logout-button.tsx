"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/actions/auth-actions";

export function LogoutButton() {
  const t = useTranslations("topbar");
  return (
    <form action={logout}>
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
        aria-label={t("logout")}
      >
        <LogOut className="size-4" />
      </Button>
    </form>
  );
}
