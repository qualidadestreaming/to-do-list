import { isOverdue } from "@/lib/activity-status";
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

// name/label ficam de fora de propósito — são libs puras sem acesso a hooks
// de i18n; os componentes de gráfico traduzem `key` via useTranslations.

export interface StatusDatum {
  key: "ready" | "on_going" | "closed";
  value: number;
}

export function computeStatusDistribution(activities: Activity[]): StatusDatum[] {
  return [
    { key: "ready", value: activities.filter((a) => a.status === "ready").length },
    { key: "on_going", value: activities.filter((a) => a.status === "on_going").length },
    { key: "closed", value: activities.filter((a) => a.status === "closed").length },
  ];
}

export interface GutBandDatum {
  key: "low" | "medium" | "high";
  value: number;
}

export function computeGutBandDistribution(activities: Activity[]): GutBandDatum[] {
  return [
    { key: "low", value: activities.filter((a) => a.priority <= 20).length },
    { key: "medium", value: activities.filter((a) => a.priority >= 21 && a.priority <= 60).length },
    { key: "high", value: activities.filter((a) => a.priority >= 61).length },
  ];
}

export interface PerformanceDatum {
  ownerId: string;
  name: string;
  onTime: number;
  late: number;
  total: number;
}

export interface ClosureDatum {
  ownerId: string;
  name: string;
  count: number;
}

/** Volume total de atividades concluídas por responsável — throughput, sem
 * distinguir no-prazo/atrasada (isso já existe em computePerformanceByOwner,
 * que mede qualidade, não volume). */
export function computeClosuresByOwner(activities: Activity[], users: AppUser[]): ClosureDatum[] {
  const byOwner = new Map<string, number>();
  for (const activity of activities) {
    if (activity.status !== "closed") continue;
    byOwner.set(activity.owner_user_id, (byOwner.get(activity.owner_user_id) ?? 0) + 1);
  }
  return Array.from(byOwner.entries())
    .map(([ownerId, count]) => ({
      ownerId,
      name: users.find((u) => u.id === ownerId)?.name ?? "—",
      count,
    }))
    .sort((a, b) => b.count - a.count);
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

export interface ActivityBreakdownDatum {
  ownerId: string;
  name: string;
  onTime: number;
  late: number;
  overdue: number;
  active: number;
  total: number;
}

/** Generalização de computePerformanceByOwner: em vez de contar só
 * concluídas (on-time/late), reflete QUALQUER recorte filtrado — por isso
 * "Atividades por pessoa" nunca fica vazio, nem quando o filtro é só
 * "Atrasadas" (que são atividades ainda abertas, não concluídas — não
 * existiam no gráfico antigo). */
export function computeActivityBreakdownByOwner(
  activities: Activity[],
  users: AppUser[]
): ActivityBreakdownDatum[] {
  const byOwner = new Map<
    string,
    { onTime: number; late: number; overdue: number; active: number }
  >();

  for (const activity of activities) {
    const entry = byOwner.get(activity.owner_user_id) ?? {
      onTime: 0,
      late: 0,
      overdue: 0,
      active: 0,
    };
    if (activity.status === "closed") {
      if (activity.performance === "on_time") entry.onTime += 1;
      else if (activity.performance === "late") entry.late += 1;
    } else if (isOverdue(activity.due_date, activity.status)) {
      entry.overdue += 1;
    } else {
      entry.active += 1;
    }
    byOwner.set(activity.owner_user_id, entry);
  }

  return Array.from(byOwner.entries())
    .map(([ownerId, counts]) => ({
      ownerId,
      name: users.find((u) => u.id === ownerId)?.name ?? "—",
      ...counts,
      total: counts.onTime + counts.late + counts.overdue + counts.active,
    }))
    .sort((a, b) => b.total - a.total);
}
