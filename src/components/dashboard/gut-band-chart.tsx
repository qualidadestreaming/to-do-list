"use client";

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GutBandDatum } from "@/lib/dashboard-metrics";

const COLORS: Record<GutBandDatum["key"], string> = {
  low: "var(--gut-low-foreground)",
  medium: "var(--gut-medium-foreground)",
  high: "var(--gut-high-foreground)",
};

const RANGE_KEY = { low: "lowRange", medium: "mediumRange", high: "highRange" } as const;

export function GutBandChart({ data }: { data: GutBandDatum[] }) {
  const t = useTranslations("dashboard.charts");
  const tGut = useTranslations("activities.gutBands");
  const hasData = data.some((d) => d.value > 0);
  const chartData = data.map((d) => ({ ...d, name: tGut(RANGE_KEY[d.key]) }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{t("gutDistribution")}</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
              <Tooltip cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.key} fill={COLORS[entry.key]} />
                ))}
                <LabelList
                  dataKey="value"
                  position="top"
                  fill="var(--foreground)"
                  fontSize={12}
                  fontWeight={700}
                />
              </Bar>
            </BarChart>
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
