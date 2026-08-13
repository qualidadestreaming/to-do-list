"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StatusDatum } from "@/lib/dashboard-metrics";

const COLORS: Record<StatusDatum["key"], string> = {
  ready: "var(--status-ready-foreground)",
  on_going: "var(--status-ongoing-foreground)",
  closed: "var(--status-closed-foreground)",
};

export function StatusDistributionChart({ data }: { data: StatusDatum[] }) {
  const hasData = data.some((d) => d.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Distribuição por status</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="55%"
                outerRadius="85%"
                paddingAngle={2}
              >
                {data.map((entry) => (
                  <Cell key={entry.key} fill={COLORS[entry.key]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={32} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Sem dados para o filtro atual.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
