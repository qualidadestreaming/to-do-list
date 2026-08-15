"use client";

import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ListChecks,
  PlayCircle,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardKpis } from "@/lib/dashboard-metrics";
import { cn } from "@/lib/utils";

// Ícone em badge circular pastel acima do número, tudo centralizado — padrão
// extraído do "Ciclo de Gente" (sistema interno da empresa), mais fácil de
// escanear que label+valor alinhados à esquerda.
export function KpiCards({ kpis }: { kpis: DashboardKpis }) {
  const t = useTranslations("dashboard.kpis");

  const onTimeColor =
    kpis.onTimePercentage === null
      ? undefined
      : kpis.onTimePercentage >= 80
        ? "text-status-closed-foreground"
        : kpis.onTimePercentage >= 50
          ? "text-gut-medium-foreground"
          : "text-status-overdue-foreground";

  const onTimeBadge =
    kpis.onTimePercentage === null
      ? "bg-muted text-muted-foreground"
      : kpis.onTimePercentage >= 80
        ? "bg-status-closed text-status-closed-foreground"
        : kpis.onTimePercentage >= 50
          ? "bg-gut-medium text-gut-medium-foreground"
          : "bg-status-overdue text-status-overdue-foreground";

  const overdueBadge =
    kpis.overdue > 0
      ? "bg-status-overdue text-status-overdue-foreground"
      : "bg-status-closed text-status-closed-foreground";

  const pctOfTotal = (n: number) =>
    kpis.total > 0 ? t("subPercentOfTotal", { pct: Math.round((n / kpis.total) * 100) }) : undefined;

  const items: {
    label: string;
    value: string;
    icon: LucideIcon;
    badge: string;
    accent?: string;
    sub?: string;
    subAccent?: string;
  }[] = [
    {
      label: t("total"),
      value: String(kpis.total),
      icon: ListChecks,
      badge: "bg-primary/10 text-primary",
      sub: t("subTotal"),
    },
    {
      label: t("ready"),
      value: String(kpis.ready),
      icon: Clock,
      badge: "bg-status-ready text-status-ready-foreground",
      sub: pctOfTotal(kpis.ready),
    },
    {
      label: t("onGoing"),
      value: String(kpis.onGoing),
      icon: PlayCircle,
      badge: "bg-status-ongoing text-status-ongoing-foreground",
      sub: pctOfTotal(kpis.onGoing),
    },
    {
      label: t("closed"),
      value: String(kpis.closed),
      icon: CheckCircle2,
      badge: "bg-status-closed text-status-closed-foreground",
      accent: "text-status-closed-foreground",
      sub: pctOfTotal(kpis.closed),
    },
    {
      label: t("overdue"),
      value: String(kpis.overdue),
      icon: AlertTriangle,
      badge: overdueBadge,
      accent: kpis.overdue > 0 ? "text-status-overdue-foreground" : undefined,
      sub: kpis.overdue > 0 ? t("subOverdueWarn") : t("subOverdueOk"),
      subAccent: kpis.overdue > 0 ? "text-status-overdue-foreground" : "text-status-closed-foreground",
    },
    {
      label: t("onTimePercentage"),
      value: kpis.onTimePercentage === null ? "—" : `${kpis.onTimePercentage}%`,
      icon: TrendingUp,
      badge: onTimeBadge,
      accent: onTimeColor,
      sub:
        kpis.onTimePercentage === null
          ? undefined
          : kpis.onTimePercentage >= 80
            ? t("subGood")
            : kpis.onTimePercentage >= 50
              ? t("subMedium")
              : t("subBad"),
      subAccent: onTimeColor,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((item) => (
        <Card key={item.label} className="gap-2 py-5">
          <CardContent className="flex flex-col items-center gap-1.5 px-4 text-center">
            <span className={cn("flex size-9 items-center justify-center rounded-full", item.badge)}>
              <item.icon className="size-[18px]" />
            </span>
            <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
            <span className={cn("text-3xl font-bold tabular-nums text-foreground", item.accent)}>
              {item.value}
            </span>
            {item.sub && (
              <p className={cn("text-[11px] font-semibold text-muted-foreground", item.subAccent)}>
                {item.sub}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
