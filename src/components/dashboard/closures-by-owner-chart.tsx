"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClosureDatum } from "@/lib/dashboard-metrics";

export function ClosuresByOwnerChart({ data }: { data: ClosureDatum[] }) {
  const t = useTranslations("dashboard.charts");
  const height = Math.max(40 * data.length, 160);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{t("closuresByOwner")}</CardTitle>
        <p className="text-xs text-muted-foreground">{t("closuresByOwnerSubtitle")}</p>
      </CardHeader>
      <CardContent style={{ height }}>
        {data.length > 0 ? (
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
              <Bar dataKey="count" fill="var(--brand-purple)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {t("noCompletedData")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
