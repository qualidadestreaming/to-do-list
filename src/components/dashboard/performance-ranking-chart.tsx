"use client";

import { Bar, BarChart, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DASHBOARD_CARD_HEIGHT, RANKING_ROW_HEIGHT } from "@/components/dashboard/chart-sizing";
import type { PerformanceDatum } from "@/lib/dashboard-metrics";

export function PerformanceRankingChart({ data }: { data: PerformanceDatum[] }) {
  const t = useTranslations("dashboard.charts");
  const innerHeight = Math.max(RANKING_ROW_HEIGHT * data.length, DASHBOARD_CARD_HEIGHT);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{t("performanceRanking")}</CardTitle>
      </CardHeader>
      <CardContent style={{ height: DASHBOARD_CARD_HEIGHT }} className="overflow-y-auto">
        {data.length > 0 ? (
          <div style={{ height: innerHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
                barCategoryGap="20%"
              >
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fontSize: 12 }}
                  stroke="var(--muted-foreground)"
                />
                <Tooltip cursor={{ fill: "var(--muted)" }} />
                <Legend />
                <Bar
                  dataKey="onTime"
                  name={t("onTime")}
                  stackId="perf"
                  fill="var(--status-closed-foreground)"
                  radius={[0, 0, 0, 0]}
                  maxBarSize={26}
                >
                  <LabelList
                    dataKey="onTime"
                    position="center"
                    fill="var(--card)"
                    fontSize={12}
                    fontWeight={700}
                    formatter={(value) => (Number(value) > 0 ? value : "")}
                  />
                </Bar>
                <Bar
                  dataKey="late"
                  name={t("late")}
                  stackId="perf"
                  fill="var(--status-overdue-foreground)"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={26}
                >
                  <LabelList
                    dataKey="late"
                    position="center"
                    fill="var(--card)"
                    fontSize={12}
                    fontWeight={700}
                    formatter={(value) => (Number(value) > 0 ? value : "")}
                  />
                  <LabelList
                    dataKey="total"
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
            {t("noCompletedData")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
