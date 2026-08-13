"use client";

import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PerformanceDatum } from "@/lib/dashboard-metrics";

export function PerformanceRankingChart({ data }: { data: PerformanceDatum[] }) {
  const height = Math.max(64 * data.length, 160);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Performance por responsável (concluídas no prazo × com atraso)
        </CardTitle>
      </CardHeader>
      <CardContent style={{ height }}>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
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
                name="No prazo"
                stackId="perf"
                fill="var(--status-closed-foreground)"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="late"
                name="Com atraso"
                stackId="perf"
                fill="var(--status-overdue-foreground)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Nenhuma atividade concluída no filtro atual.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
