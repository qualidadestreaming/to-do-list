"use client";

import { useTranslations } from "next-intl";
import type { ActivityStatus } from "@/types/database";
import { cn } from "@/lib/utils";

export { isOverdue } from "@/lib/activity-status";

const STATUS_CLASSES: Record<ActivityStatus, string> = {
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
      <span className="inline-flex items-center gap-1 rounded-full bg-status-overdue px-2 py-0.5 text-xs font-medium text-status-overdue-foreground">
        {t("overdue")}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        STATUS_CLASSES[status]
      )}
    >
      {t(status)}
    </span>
  );
}
