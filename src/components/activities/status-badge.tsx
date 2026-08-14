"use client";

import { useTranslations } from "next-intl";
import type { ActivityStatus } from "@/types/database";
import { cn } from "@/lib/utils";

export { isOverdue } from "@/lib/activity-status";

// Estilo "ponto + texto" (padrão dos BI internos Multilaser — ver skill
// dashboard-multilaser) em vez de pílula preenchida: a cor vira um indicador
// pontual, não uma mancha de cor por linha da tabela.
const DOT_CLASSES: Record<ActivityStatus, string> = {
  ready: "bg-status-ready-foreground",
  on_going: "bg-status-ongoing-foreground",
  closed: "bg-status-closed-foreground",
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
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-status-overdue-foreground">
        <span className="size-1.5 rounded-full bg-status-overdue-foreground" />
        {t("overdue")}
      </span>
    );
  }
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-foreground")}
    >
      <span className={cn("size-1.5 rounded-full", DOT_CLASSES[status])} />
      {t(status)}
    </span>
  );
}
