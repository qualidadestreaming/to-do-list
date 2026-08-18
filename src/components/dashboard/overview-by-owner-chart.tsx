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
import type { OwnerTotalDatum } from "@/lib/dashboard-metrics";

export function OverviewByOwnerChart({ data }: { data: OwnerTotalDatum[] }) {
  const t = useTranslations("dashboard.charts");
  const innerHeight = Math.max(RANKING_ROW_HEIGHT * data.length, DASHBOARD_CARD_HEIGHT);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{t("overviewByOwner")}</CardTitle>
        <p className="text-xs text-muted-foreground">{t("overviewByOwnerSubtitle")}</p>
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
                <Bar dataKey="count" name={t("overviewByOwner")} fill="var(--brand-blue)" radius={[0, 4, 4, 0]} maxBarSize={RANKING_BAR_SIZE}>
                  <LabelList
                    dataKey="count"
                    position="right"
                    fill="var(--foreground)"
                    fontSize={12}
                    fontWeight={700}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {t("noData")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
