"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DASHBOARD_CARD_HEIGHT } from "@/components/dashboard/chart-sizing";
import type { StatusDatum } from "@/lib/dashboard-metrics";

const COLORS: Record<StatusDatum["key"], string> = {
  ready: "var(--status-ready-foreground)",
  on_going: "var(--status-ongoing-foreground)",
  closed: "var(--status-closed-foreground)",
};

export function StatusDistributionChart({ data }: { data: StatusDatum[] }) {
  const t = useTranslations("dashboard.charts");
  const tStatus = useTranslations("activities.status");
  const hasData = data.some((d) => d.value > 0);
  const chartData = data.map((d) => ({ ...d, name: tStatus(d.key) }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{t("statusDistribution")}</CardTitle>
      </CardHeader>
      <CardContent style={{ height: DASHBOARD_CARD_HEIGHT }}>
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius="55%"
                outerRadius="85%"
                paddingAngle={2}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.key} fill={COLORS[entry.key]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend
                verticalAlign="bottom"
                height={32}
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span style={{ color: "var(--muted-foreground)", fontSize: 12, fontWeight: 600 }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {t("noData")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
