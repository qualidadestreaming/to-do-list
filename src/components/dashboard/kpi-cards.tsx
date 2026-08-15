"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardKpis } from "@/lib/dashboard-metrics";
import { cn } from "@/lib/utils";

// Número grande e colorido direto sobre o card branco, sem pílula de fundo —
// padrão dos BI internos Multilaser (vermelho/verde só quando o valor em si
// é bom/ruim). Ver skill dashboard-multilaser.
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

  const pctOfTotal = (n: number) =>
    kpis.total > 0 ? t("subPercentOfTotal", { pct: Math.round((n / kpis.total) * 100) }) : undefined;

  const items: { label: string; value: string; accent?: string; sub?: string; subAccent?: string }[] = [
    { label: t("total"), value: String(kpis.total), sub: t("subTotal") },
    { label: t("ready"), value: String(kpis.ready), sub: pctOfTotal(kpis.ready) },
    { label: t("onGoing"), value: String(kpis.onGoing), sub: pctOfTotal(kpis.onGoing) },
    {
      label: t("closed"),
      value: String(kpis.closed),
      accent: "text-status-closed-foreground",
      sub: pctOfTotal(kpis.closed),
    },
    {
      label: t("overdue"),
      value: String(kpis.overdue),
      accent: kpis.overdue > 0 ? "text-status-overdue-foreground" : undefined,
      sub: kpis.overdue > 0 ? t("subOverdueWarn") : t("subOverdueOk"),
      subAccent: kpis.overdue > 0 ? "text-status-overdue-foreground" : "text-status-closed-foreground",
    },
    {
      label: t("onTimePercentage"),
      value: kpis.onTimePercentage === null ? "—" : `${kpis.onTimePercentage}%`,
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
        <Card key={item.label} className="gap-1 py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {item.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <span className={cn("text-3xl font-bold tabular-nums text-foreground", item.accent)}>
              {item.value}
            </span>
            {item.sub && (
              <p className={cn("mt-1 text-[11px] font-semibold text-muted-foreground", item.subAccent)}>
                {item.sub}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
