import type { ActivityStatus } from "@/types/database";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<ActivityStatus, string> = {
  ready: "Pronta",
  on_going: "Em andamento",
  closed: "Concluída",
};

const STATUS_CLASSES: Record<ActivityStatus, string> = {
  ready: "bg-status-ready text-status-ready-foreground",
  on_going: "bg-status-ongoing text-status-ongoing-foreground",
  closed: "bg-status-closed text-status-closed-foreground",
};

export function isOverdue(dueDate: string | null, status: ActivityStatus): boolean {
  if (!dueDate || status === "closed") return false;
  const today = new Date().toISOString().slice(0, 10);
  return dueDate < today;
}

export function StatusBadge({
  status,
  overdue,
}: {
  status: ActivityStatus;
  overdue?: boolean;
}) {
  if (overdue) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-status-overdue px-2 py-0.5 text-xs font-medium text-status-overdue-foreground">
        Atrasada
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
      {STATUS_LABEL[status]}
    </span>
  );
}
