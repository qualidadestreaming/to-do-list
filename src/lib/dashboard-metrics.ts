import { isOverdue } from "@/components/activities/status-badge";
import type { Activity, AppUser } from "@/types/database";

export interface DashboardKpis {
  total: number;
  ready: number;
  onGoing: number;
  closed: number;
  overdue: number;
  onTimePercentage: number | null;
}

export function computeKpis(activities: Activity[]): DashboardKpis {
  const total = activities.length;
  const ready = activities.filter((a) => a.status === "ready").length;
  const onGoing = activities.filter((a) => a.status === "on_going").length;
  const closed = activities.filter((a) => a.status === "closed").length;
  const overdue = activities.filter((a) => isOverdue(a.due_date, a.status)).length;

  const closedWithPerformance = activities.filter(
    (a) => a.status === "closed" && a.performance !== null
  );
  const onTime = closedWithPerformance.filter((a) => a.performance === "on_time").length;
  const onTimePercentage =
    closedWithPerformance.length > 0 ? Math.round((onTime / closedWithPerformance.length) * 100) : null;

  return { total, ready, onGoing, closed, overdue, onTimePercentage };
}

export interface StatusDatum {
  key: "ready" | "on_going" | "closed";
  name: string;
  value: number;
}

export function computeStatusDistribution(activities: Activity[]): StatusDatum[] {
  return [
    { key: "ready", name: "Pronta", value: activities.filter((a) => a.status === "ready").length },
    {
      key: "on_going",
      name: "Em andamento",
      value: activities.filter((a) => a.status === "on_going").length,
    },
    { key: "closed", name: "Concluída", value: activities.filter((a) => a.status === "closed").length },
  ];
}

export interface GutBandDatum {
  key: "low" | "medium" | "high";
  name: string;
  value: number;
}

export function computeGutBandDistribution(activities: Activity[]): GutBandDatum[] {
  return [
    { key: "low", name: "Baixa (1–20)", value: activities.filter((a) => a.priority <= 20).length },
    {
      key: "medium",
      name: "Média (21–60)",
      value: activities.filter((a) => a.priority >= 21 && a.priority <= 60).length,
    },
    { key: "high", name: "Alta (61–125)", value: activities.filter((a) => a.priority >= 61).length },
  ];
}

export interface PerformanceDatum {
  ownerId: string;
  name: string;
  onTime: number;
  late: number;
  total: number;
}

export function computePerformanceByOwner(
  activities: Activity[],
  users: AppUser[]
): PerformanceDatum[] {
  const byOwner = new Map<string, { onTime: number; late: number }>();

  for (const activity of activities) {
    if (activity.status !== "closed" || !activity.performance) continue;
    const entry = byOwner.get(activity.owner_user_id) ?? { onTime: 0, late: 0 };
    if (activity.performance === "on_time") entry.onTime += 1;
    else entry.late += 1;
    byOwner.set(activity.owner_user_id, entry);
  }

  return Array.from(byOwner.entries())
    .map(([ownerId, counts]) => ({
      ownerId,
      name: users.find((u) => u.id === ownerId)?.name ?? "—",
      onTime: counts.onTime,
      late: counts.late,
      total: counts.onTime + counts.late,
    }))
    .sort((a, b) => b.total - a.total);
}
