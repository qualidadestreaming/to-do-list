"use client";

import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DASHBOARD_CARD_HEIGHT, RANKING_ROW_HEIGHT } from "@/components/dashboard/chart-sizing";
import type { ClosureDatum } from "@/lib/dashboard-metrics";

export function ClosuresByOwnerChart({ data }: { data: ClosureDatum[] }) {
  const t = useTranslations("dashboard.charts");
  const innerHeight = Math.max(RANKING_ROW_HEIGHT * data.length, DASHBOARD_CARD_HEIGHT);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{t("closuresByOwner")}</CardTitle>
        <p className="text-xs text-muted-foreground">{t("closuresByOwnerSubtitle")}</p>
      </CardHeader>
      <CardContent style={{ height: DASHBOARD_CARD_HEIGHT }} className="overflow-y-auto">
        {data.length > 0 ? (
          <div style={{ height: innerHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, left: 8, bottom: 0 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fontSize: 12 }}
                  stroke="var(--muted-foreground)"
                />
                <Tooltip cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="count" fill="var(--brand-purple)" radius={[0, 4, 4, 0]} maxBarSize={28}>
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
            {t("noCompletedData")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
