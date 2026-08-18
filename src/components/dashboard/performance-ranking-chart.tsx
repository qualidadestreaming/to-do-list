"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DASHBOARD_CARD_HEIGHT,
  RANKING_BAR_CATEGORY_GAP,
  RANKING_BAR_SIZE,
  RANKING_CHART_MARGIN,
  RANKING_ROW_HEIGHT,
} from "@/components/dashboard/chart-sizing";
import type { ActiveOverdueDatum } from "@/lib/dashboard-metrics";

export function PerformanceRankingChart({ data }: { data: ActiveOverdueDatum[] }) {
  const t = useTranslations("dashboard.charts");
  const innerHeight = Math.max(RANKING_ROW_HEIGHT * data.length, DASHBOARD_CARD_HEIGHT);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{t("performanceRanking")}</CardTitle>
        <p className="text-xs text-muted-foreground">{t("performanceRankingSubtitle")}</p>
        {/* Legenda em HTML, fora do <BarChart> de propósito: o gráfico vive
            num container que rola, e a <Legend> do Recharts é desenhada no pé
            do SVG — com muitas pessoas na lista ela só aparecia depois de
            rolar até o fim. Aqui ela fica fixa, sempre visível. */}
        {data.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <span className="size-2.5 rounded-sm bg-gut-medium-foreground" />
              {t("active")}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <span className="size-2.5 rounded-sm bg-status-overdue-foreground" />
              {t("overdueLabel")}
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent style={{ height: DASHBOARD_CARD_HEIGHT }} className="overflow-y-auto">
        {data.length > 0 ? (
          <div style={{ height: innerHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={RANKING_CHART_MARGIN}
                barCategoryGap={RANKING_BAR_CATEGORY_GAP}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fontSize: 12 }}
                  stroke="var(--muted-foreground)"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="active" name={t("active")} stackId="perf" fill="var(--gut-medium-foreground)" maxBarSize={RANKING_BAR_SIZE}>
                  <LabelList dataKey="active" position="center" fill="var(--card)" fontSize={12} fontWeight={700} formatter={(value) => (Number(value) > 0 ? value : "")} />
                </Bar>
                <Bar dataKey="overdue" name={t("overdueLabel")} stackId="perf" fill="var(--status-overdue-foreground)" radius={[0, 4, 4, 0]} maxBarSize={RANKING_BAR_SIZE}>
                  <LabelList dataKey="overdue" position="center" fill="var(--card)" fontSize={12} fontWeight={700} formatter={(value) => (Number(value) > 0 ? value : "")} />
                  <LabelList dataKey="total" position="right" fill="var(--foreground)" fontSize={12} fontWeight={700} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {t("noOngoingData")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
