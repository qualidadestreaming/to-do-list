"use client";

import { useTranslations } from "next-intl";
import type { ActivityStatus } from "@/types/database";
import { cn } from "@/lib/utils";

export { isOverdue } from "@/lib/activity-status";

// Pílula pastel preenchida (padrão Hisense Ações / SIGES / financeiro-app) —
// mais fácil de escanear numa lista densa que o ponto+texto.
const PILL_CLASSES: Record<ActivityStatus, string> = {
  ready: "bg-status-ready text-status-ready-foreground",
  on_going: "bg-status-ongoing text-status-ongoing-foreground",
  closed: "bg-status-closed text-status-closed-foreground",
};

export function StatusBadge({
  status,
  overdue,
}: {
  status: ActivityStatus;
  overdue?: boolean;
}) {
  const t = useTranslations("activities.status");

  if (overdue) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-status-overdue px-2.5 py-0.5 text-xs font-bold text-status-overdue-foreground">
        <span className="size-1.5 rounded-full bg-current" />
        {t("overdue")}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold",
        PILL_CLASSES[status]
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {t(status)}
    </span>
  );
}
